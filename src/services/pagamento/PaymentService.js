import prisma from '../../lib/prisma.js';
import { BadRequestError, ConflictError, ForbiddenError, NotFoundError, ExternalServiceError, ServiceUnavailableError } from '../../errors/index.js';
import { MercadoPagoClient } from './MercadoPagoClient.js';
import { assertPayable, cents, installmentStatus, splitPayment } from './paymentPolicy.js';
import { canCustomerReview } from '../avaliacao/reviewPolicy.js';

const include = {
  checkin_checkout: true,
  avaliacao: { where: { autor_tipo: 'Cliente' }, select: { id_avaliacao: true, nota: true, comentario: true } },
  pagamento_parcela: { include: { transacoes: true }, orderBy: { fase: 'asc' } },
};

export class PaymentService {
  constructor(database = prisma, provider = new MercadoPagoClient()) {
    this.database = database;
    this.provider = provider;
  }

  async participant(id, auth, database = this.database) {
    const appointment = await database.agendamento.findUnique({ where: { id_agendamento: Number(id) }, include });
    if (!appointment) throw new NotFoundError('Agendamento não encontrado.');
    if (appointment.id_cliente !== auth?.id_cliente && appointment.id_diarista !== auth?.id_diarista) {
      throw new ForbiddenError('Agendamento não pertence ao usuário autenticado.');
    }
    return appointment;
  }

  summary(appointment) {
    const amounts = splitPayment(appointment.valor_estimado);
    const installments = ['Entrada', 'Saldo'].map((phase) => {
      const installment = appointment.pagamento_parcela.find((item) => item.fase === phase);
      let canPay = false;
      try { assertPayable(appointment, phase); canPay = true; } catch { /* Fase ainda não liberada. */ }
      if (phase === 'Saldo' && !appointment.pagamento_parcela.some((item) => item.fase === 'Entrada' && item.status === 'Pago')) canPay = false;
      const status = installment?.status || 'Pendente';
      return {
        fase: phase,
        valor: (installment?.valor_centavos ?? amounts[phase.toLowerCase()]) / 100,
        status,
        pode_pagar: canPay && ['Pendente', 'Falhou'].includes(status),
        estorno_pendente: installment?.transacoes.some((item) => item.estorno_pendente) || false,
      };
    });
    return {
      id_agendamento: appointment.id_agendamento,
      status_agendamento: appointment.status,
      valor_total: (amounts.entrada + amounts.saldo) / 100,
      moeda: 'BRL',
      quitado: installments.every((item) => item.status === 'Pago'),
      pode_avaliar: canCustomerReview(appointment) && !appointment.avaliacao?.length,
      avaliacao_cliente: appointment.avaliacao?.[0] ? {
        ...appointment.avaliacao[0], nota: Number(appointment.avaliacao[0].nota),
      } : null,
      parcelas: installments,
    };
  }

  async get(id, auth) { return this.summary(await this.participant(id, auth)); }

  async ensurePlan(appointment, tx) {
    const amounts = splitPayment(appointment.valor_estimado);
    for (const phase of ['Entrada', 'Saldo']) {
      await tx.pagamento_parcela.upsert({
        where: { id_agendamento_fase: { id_agendamento: appointment.id_agendamento, fase: phase } },
        create: { id_agendamento: appointment.id_agendamento, fase: phase, valor_centavos: amounts[phase.toLowerCase()] },
        update: {},
      });
    }
  }

  async checkout(id, phase, auth) {
    if (!['Entrada', 'Saldo'].includes(phase)) throw new BadRequestError('Parcela inválida.');
    if (!auth?.id_cliente || auth.activeProfile !== 'CLIENTE') throw new ForbiddenError('Somente o cliente pode pagar.');
    const config = this.provider.config();
    // Reconcilia tentativas anteriores antes de oferecer uma nova cobrança.
    await this.refresh(id, auth);
    const installment = await this.database.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT id_agendamento FROM agendamento WHERE id_agendamento = ${Number(id)} FOR UPDATE`;
      const appointment = await this.participant(id, auth, tx);
      if (appointment.id_cliente !== auth.id_cliente) throw new ForbiddenError('Somente o cliente titular pode pagar.');
      assertPayable(appointment, phase);
      await this.ensurePlan(appointment, tx);
      const current = await tx.pagamento_parcela.findUnique({ where: { id_agendamento_fase: { id_agendamento: Number(id), fase: phase } } });
      if (!['Pendente', 'Falhou'].includes(current.status)) throw new ConflictError('Esta parcela já foi paga ou exige análise antes de uma nova cobrança.');
      if (phase === 'Saldo') {
        const entry = await tx.pagamento_parcela.findUnique({ where: { id_agendamento_fase: { id_agendamento: Number(id), fase: 'Entrada' } } });
        if (entry.status !== 'Pago') throw new ConflictError('A entrada precisa estar paga antes do saldo.');
      }
      if (current.checkout_url && current.expira_em > new Date()) return { ...current, reuse: true };
      if (current.criacao_em && Date.now() - current.criacao_em.getTime() < 60000) throw new ConflictError('O link está sendo preparado. Aguarde alguns instantes.');
      return tx.pagamento_parcela.update({ where: { id_parcela: current.id_parcela }, data: { criacao_em: new Date() } });
    });
    if (installment.reuse) return { checkout_url: installment.checkout_url, fase: phase };

    const expires = new Date(Date.now() + 24 * 60 * 60 * 1000);
    try {
      const preference = await this.provider.createPreference({
        items: [{ id: installment.id_parcela, title: `Diária Certa #${id} — ${phase} (50%)`, quantity: 1, currency_id: 'BRL', unit_price: installment.valor_centavos / 100 }],
        external_reference: installment.id_parcela,
        metadata: { diaria_certa_parcela: installment.id_parcela, diaria_certa_agendamento: Number(id), diaria_certa_fase: phase },
        ...(config.returnUrl ? {
          back_urls: { success: config.returnUrl, pending: config.returnUrl, failure: config.returnUrl },
          auto_return: 'approved',
        } : {}),
        ...(config.notificationUrl ? { notification_url: config.notificationUrl } : {}),
        expires: true, expiration_date_from: new Date().toISOString(), expiration_date_to: expires.toISOString(),
        // Sem boleto: evita um vencimento longo incompatível com o início da diária.
        payment_methods: { excluded_payment_types: [{ id: 'ticket' }], installments: 1 },
      });
      // Contas vendedoras de teste usam init_point; o sandbox fica como compatibilidade.
      const checkoutUrl = preference.init_point || (!config.production ? preference.sandbox_init_point : undefined);
      const url = new URL(checkoutUrl);
      const hosts = config.production
        ? ['www.mercadopago.com.br', 'www.mercadopago.com']
        : ['www.mercadopago.com.br', 'www.mercadopago.com', 'sandbox.mercadopago.com.br', 'sandbox.mercadopago.com'];
      if (url.protocol !== 'https:' || url.username || url.password || !hosts.includes(url.hostname)
        || String(preference.collector_id) !== config.collectorId || typeof preference.id !== 'string') {
        throw new ExternalServiceError('O Mercado Pago retornou um checkout inválido.');
      }
      await this.database.pagamento_parcela.update({
        where: { id_parcela: installment.id_parcela },
        data: { id_preferencia: preference.id, checkout_url: checkoutUrl, expira_em: expires, criacao_em: null },
      });
      return { checkout_url: checkoutUrl, fase: phase };
    } catch (error) {
      await this.database.pagamento_parcela.update({ where: { id_parcela: installment.id_parcela }, data: { criacao_em: null } });
      if (error instanceof ExternalServiceError || error instanceof ServiceUnavailableError) throw error;
      throw new ExternalServiceError('Não foi possível preparar o checkout. Tente novamente.');
    }
  }

  async refresh(id, auth) {
    const appointment = await this.participant(id, auth);
    for (const installment of appointment.pagamento_parcela) {
      if (!installment.id_preferencia) continue;
      const result = await this.provider.searchPayments(installment.id_parcela);
      if (!Array.isArray(result.results) || (result.paging?.total || 0) > 100) throw new ExternalServiceError('Não foi possível reconciliar todas as tentativas de pagamento. Contate o suporte.');
      for (const payment of result.results) await this.reconcile(String(payment.id));
    }
    await this.processRefunds(Number(id));
    return this.get(id, auth);
  }

  async reconcile(paymentId) {
    if (!/^\d+$/.test(paymentId)) throw new BadRequestError('Identificador de pagamento inválido.');
    const payment = await this.provider.getPayment(paymentId);
    if (String(payment.id) !== paymentId) throw new BadRequestError('Pagamento divergente.');
    return this.applyPayment(payment);
  }

  async validatePaymentEnvironment(payment, config) {
    if (payment.live_mode === config.production) return;
    // Checkout Pro com conta test_user pode retornar live_mode=true.
    // Essa exceção só é válida com identidade e recebedor de teste verificados na API.
    if (config.production || payment.live_mode !== true || typeof this.provider.assertTestAccount !== 'function') {
      throw new BadRequestError('O ambiente do pagamento não corresponde ao ambiente configurado.');
    }
    await this.provider.assertTestAccount();
  }

  // Somente dados consultados na API autenticada chegam aqui; nunca o corpo do navegador/webhook.
  async applyPayment(payment) {
    const reference = payment.external_reference;
    if (typeof reference !== 'string') return { ignored: true };
    const known = await this.database.pagamento_parcela.findUnique({ where: { id_parcela: reference } });
    if (!known) return { ignored: true };
    const config = this.provider.config();
    if (String(payment.collector_id) !== config.collectorId || payment.currency_id !== 'BRL'
      || cents(payment.transaction_amount) !== known.valor_centavos
      || payment.metadata?.diaria_certa_parcela !== reference
      || Number(payment.metadata?.diaria_certa_agendamento) !== known.id_agendamento
      || payment.metadata?.diaria_certa_fase !== known.fase) {
      throw new BadRequestError('Pagamento não corresponde à parcela, valor ou conta recebedora.');
    }
    await this.validatePaymentEnvironment(payment, config);
    const updatedAt = new Date(payment.date_last_updated);
    if (!Number.isFinite(updatedAt.getTime()) || typeof payment.status !== 'string' || payment.status.length > 40) throw new BadRequestError('Estado do pagamento inválido.');

    await this.database.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT id_agendamento FROM agendamento WHERE id_agendamento = ${known.id_agendamento} FOR UPDATE`;
      const appointment = await tx.agendamento.findUnique({ where: { id_agendamento: known.id_agendamento }, include });
      const current = await tx.pagamento_transacao.findUnique({ where: { id_pagamento: String(payment.id) } });
      if (current && current.provedor_atualizado_em > updatedAt) return;
      if (current && current.id_parcela !== reference) throw new ConflictError('Pagamento já vinculado a outra parcela.');
      const refunded = payment.status === 'refunded' ? known.valor_centavos : cents(payment.transaction_amount_refunded ?? 0);
      if (refunded > known.valor_centavos) throw new BadRequestError('Valor de estorno inválido.');
      await tx.pagamento_transacao.upsert({
        where: { id_pagamento: String(payment.id) },
        create: { id_pagamento: String(payment.id), id_parcela: reference, status: payment.status, valor_centavos: known.valor_centavos, estornado_centavos: refunded, provedor_atualizado_em: updatedAt },
        update: { status: payment.status, estornado_centavos: refunded, provedor_atualizado_em: updatedAt,
          ...(refunded === known.valor_centavos || ['refunded', 'charged_back', 'cancelled', 'rejected'].includes(payment.status)
            ? { estorno_pendente: false } : {}) },
      });
      const transactions = await tx.pagamento_transacao.findMany({ where: { id_parcela: reference }, orderBy: [{ criado_em: 'asc' }, { id_pagamento: 'asc' }] });
      const validAppointment = known.fase === 'Entrada'
        ? ['Aceito', 'Em_andamento', 'Concluido'].includes(appointment.status)
        : appointment.status === 'Concluido' && appointment.checkin_checkout[0]?.horario_checkout;
      let credited = false;
      for (const item of transactions) {
        if (item.status !== 'approved' || item.estornado_centavos >= item.valor_centavos) continue;
        // Cancelamento, pagamento fora da fase ou segunda aprovação: devolver, não cobrar duas vezes.
        const mustRefund = item.estorno_pendente || !validAppointment || credited;
        if (mustRefund && !item.estorno_pendente) {
          await tx.pagamento_transacao.update({ where: { id_pagamento: item.id_pagamento }, data: { estorno_pendente: true } });
          item.estorno_pendente = true;
        }
        if (!mustRefund) credited = true;
      }
      const status = installmentStatus(transactions, known.valor_centavos);
      await tx.pagamento_parcela.update({ where: { id_parcela: reference }, data: { status } });
      const installments = await tx.pagamento_parcela.findMany({ where: { id_agendamento: known.id_agendamento } });
      const paid = installments.length === 2 && installments.every((item) => item.status === 'Pago');
      await tx.checkin_checkout.updateMany({
        where: { id_agendamento: known.id_agendamento },
        data: {
          status_pagamento: paid ? 'Pago' : 'Pendente',
          pagamento_em: paid ? appointment.checkin_checkout[0]?.pagamento_em || new Date() : null,
        },
      });
    });
    return { received: true };
  }

  // Fila durável: uma falha de rede não perde o estorno e a chave é a mesma em cada repetição.
  async processRefunds(appointmentId) {
    if (!appointmentId && process.env.MERCADOPAGO_ENABLED !== 'true') return;
    const pending = await this.database.pagamento_transacao.findMany({
      where: { estorno_pendente: true, ...(appointmentId ? { parcela: { id_agendamento: appointmentId } } : {}) },
      take: 25, orderBy: { atualizado_em: 'asc' },
    });
    for (const item of pending) {
      try {
        const payment = await this.provider.getPayment(item.id_pagamento);
        if (payment.status === 'approved' && Number(payment.transaction_amount_refunded || 0) < Number(payment.transaction_amount)) {
          await this.provider.refund(item.id_pagamento);
        }
        await this.reconcile(item.id_pagamento);
      } catch {
        // Mantém na fila e permite processar as demais; não registra dados sensíveis.
        await this.database.pagamento_transacao.update({ where: { id_pagamento: item.id_pagamento }, data: { atualizado_em: new Date() } });
      }
    }
  }
}

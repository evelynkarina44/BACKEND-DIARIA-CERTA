import 'dotenv/config';
import test from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import prisma from '../src/lib/prisma.js';
import { PaymentService } from '../src/services/pagamento/PaymentService.js';
import { CheckinCheckoutWorkflowService } from '../src/services/checkinCheckout/CheckinCheckoutWorkflowService.js';
import { AgendamentoWorkflowService } from '../src/services/agendamento/AgendamentoWorkflowService.js';
import { AvaliacaoWorkflowService } from '../src/services/avaliacao/AvaliacaoWorkflowService.js';

test('MySQL e Mercado Pago simulado: duas parcelas, check-in, saldo, duplicidade e estorno; tudo revertido', {
  skip: process.env.RUN_PAYMENT_DATABASE_TESTS !== '1',
}, async () => {
  const rollback = new Error('ROLLBACK_PAYMENT_FIXTURES');
  try {
    await assert.rejects(prisma.$transaction(async (tx) => {
      const suffix = randomUUID();
      const userData = (kind) => ({ nome: `Teste pagamento ${kind}`, email: `pagamento-${kind}-${suffix}@example.com`, senha: 'HASH_FICTICIO_TESTE', telefone: '11999999999' });
      const customerUser = await tx.usuario.create({ data: userData('cliente') });
      const workerUser = await tx.usuario.create({ data: { ...userData('diarista'), tipo: 'DIARISTA' } });
      const customer = await tx.cliente.create({ data: { id_usuario: customerUser.id_usuario, data_nascimento: new Date('2000-01-01'), qtd_comodos: 3 } });
      const worker = await tx.diarista.create({ data: { id_usuario: workerUser.id_usuario, descricao: 'Teste revertido.', qtd_max_comodos: 5 } });
      const clientAuth = { id_usuario: customerUser.id_usuario, id_cliente: customer.id_cliente, activeProfile: 'CLIENTE' };
      const workerAuth = { id_usuario: workerUser.id_usuario, id_diarista: worker.id_diarista, activeProfile: 'DIARISTA' };
      const database = new Proxy(tx, { get(target, property) { return property === '$transaction' ? async (callback) => callback(target) : Reflect.get(target, property); } });
      const payments = new Map();
      let preferences = 0;
      let refunds = 0;
      let failRefundOnce = false;
      let timestamp = Date.now();
      const provider = {
        config: () => ({ production: false, collectorId: '123', notificationUrl: 'https://api.example.com/webhook', returnUrl: 'https://app.example.com' }),
        createPreference: async (body) => {
          preferences++;
          assert.equal(body.items[0].unit_price, body.metadata.diaria_certa_fase === 'Entrada' ? 49.99 : 50);
          assert.equal(body.items[0].currency_id, 'BRL');
          return { id: `pref-${preferences}`, collector_id: 123, sandbox_init_point: 'https://sandbox.mercadopago.com/checkout/test' };
        },
        searchPayments: async (reference) => ({ results: [...payments.values()].filter((item) => item.external_reference === reference) }),
        getPayment: async (id) => structuredClone(payments.get(id)),
        refund: async (id) => {
          if (failRefundOnce) { failRefundOnce = false; throw new Error('Rede temporariamente indisponível'); }
          refunds++;
          const item = payments.get(id);
          item.status = 'refunded'; item.transaction_amount_refunded = item.transaction_amount;
          item.date_last_updated = new Date(++timestamp).toISOString();
          return { status: 'approved' };
        },
      };
      const service = new PaymentService(database, provider);
      const checkin = new CheckinCheckoutWorkflowService(database);
      const wall = new Date(Date.now() - 30 * 60000 - Number(process.env.APP_TIMEZONE_OFFSET_MINUTES || 180) * 60000);
      const day = new Date(wall.toISOString().slice(0, 10));
      const start = new Date('1970-01-01T' + wall.toISOString().slice(11, 16) + ':00Z');
      const appointmentData = { id_cliente: customer.id_cliente, id_diarista: worker.id_diarista, data_agendamento: day, horario_inicio: start, horario_fim: new Date('1970-01-01T23:59:00Z'), valor_estimado: '99.99' };
      const appointment = await tx.agendamento.create({ data: appointmentData });
      const id = appointment.id_agendamento;
      await assert.rejects(() => service.checkout(id, 'Entrada', clientAuth), /após o aceite/);
      await tx.agendamento.update({ where: { id_agendamento: id }, data: { status: 'Aceito' } });
      await assert.rejects(() => checkin.requestCheckin(id, workerAuth), /pagar a entrada/);
      await service.checkout(id, 'Entrada', clientAuth);
      await service.checkout(id, 'Entrada', clientAuth);
      assert.equal(preferences, 1, 'Repetir o clique reutiliza o checkout');
      const installments = await tx.pagamento_parcela.findMany({ where: { id_agendamento: id }, orderBy: { fase: 'asc' } });
      assert.deepEqual(installments.map((item) => item.valor_centavos), [4999, 5000]);
      await assert.rejects(() => service.checkout(id, 'Saldo', clientAuth), /depois do checkout/);

      function approved(paymentId, installment) {
        const item = { id: Number(paymentId), collector_id: 123, currency_id: 'BRL', live_mode: false, status: 'approved', transaction_amount: installment.valor_centavos / 100, transaction_amount_refunded: 0, external_reference: installment.id_parcela,
          metadata: { diaria_certa_parcela: installment.id_parcela, diaria_certa_agendamento: installment.id_agendamento, diaria_certa_fase: installment.fase }, date_last_updated: new Date(++timestamp).toISOString() };
        payments.set(paymentId, item);
        return item;
      }
      const entry = approved('1001', installments[0]);
      await assert.rejects(() => service.applyPayment({ ...entry, transaction_amount: 1 }), /não corresponde/);
      await assert.rejects(() => service.applyPayment({ ...entry, collector_id: 999 }), /não corresponde/);
      await assert.rejects(() => service.applyPayment({ ...entry, live_mode: true }), /não corresponde/);
      await assert.rejects(() => service.applyPayment({ ...entry, currency_id: 'USD' }), /não corresponde/);
      await assert.rejects(() => service.applyPayment({ ...entry, metadata: {} }), /não corresponde/);
      // Regressão: Checkout Pro de um vendedor test_user devolveu live_mode=true.
      let accountChecks = 0;
      provider.assertTestAccount = async () => { accountChecks++; };
      entry.live_mode = true;
      await service.reconcile('1001'); await service.reconcile('1001');
      assert.equal(accountChecks, 2);
      await assert.rejects(() => service.applyPayment({ ...entry, transaction_amount: 1 }), /não corresponde/);
      await assert.rejects(() => service.applyPayment({ ...entry, collector_id: 999 }), /não corresponde/);
      await service.applyPayment({ ...entry, status: 'pending', date_last_updated: new Date(0).toISOString() });
      assert.equal(await tx.pagamento_transacao.count({ where: { id_parcela: installments[0].id_parcela } }), 1);
      assert.equal((await service.get(id, clientAuth)).parcelas[0].status, 'Pago');
      await checkin.requestCheckin(id, workerAuth);
      await checkin.confirmPayment(id, clientAuth);
      let check = await tx.checkin_checkout.findUnique({ where: { id_agendamento: id } });
      assert.equal(check.status_pagamento, 'Pendente', 'A entrada não quita a diária inteira');
      assert.equal((await tx.agendamento.findUnique({ where: { id_agendamento: id } })).status, 'Em_andamento');
      await checkin.checkout(id, workerAuth);
      await checkin.checkout(id, workerAuth);
      assert.equal((await service.get(id, clientAuth)).parcelas[1].pode_pagar, true);
      await service.checkout(id, 'Saldo', clientAuth);
      assert.equal(preferences, 2, 'O saldo tem checkout próprio com seu valor correto');
      approved('1002', installments[1]);
      await service.reconcile('1002');
      assert.equal((await service.get(id, clientAuth)).quitado, true);
      check = await tx.checkin_checkout.findUnique({ where: { id_agendamento: id } });
      assert.equal(check.status_pagamento, 'Pago');

      const reviewService = new AvaliacaoWorkflowService(database);
      const reviewData = { id_agendamento: id, nota: 5, comentario: 'Ótima diária — teste revertido.', publica: true, anonima: false };
      assert.equal((await service.get(id, clientAuth)).pode_avaliar, true);
      const review = await reviewService.create(reviewData, clientAuth);
      assert.equal(review.nota, 5);
      assert.equal(review.comentario, reviewData.comentario);
      await assert.rejects(() => reviewService.create(reviewData, clientAuth), /já avaliou/);
      assert.equal((await service.get(id, clientAuth)).pode_avaliar, false);

      approved('1003', installments[0]);
      await service.reconcile('1003');
      assert.equal((await tx.pagamento_transacao.findUnique({ where: { id_pagamento: '1003' } })).estorno_pendente, true);
      await service.processRefunds(id);
      assert.equal(refunds, 1);
      assert.equal((await service.get(id, clientAuth)).quitado, true, 'Estorno da duplicidade não retira o pagamento válido');

      const second = await tx.agendamento.create({ data: { ...appointmentData, status: 'Aceito' } });
      await service.checkout(second.id_agendamento, 'Entrada', clientAuth);
      const secondEntry = await tx.pagamento_parcela.findUnique({ where: { id_agendamento_fase: { id_agendamento: second.id_agendamento, fase: 'Entrada' } } });
      approved('1004', secondEntry); await service.reconcile('1004');
      await new AgendamentoWorkflowService(database).cancel(second.id_agendamento, clientAuth);
      assert.equal((await service.get(second.id_agendamento, clientAuth)).parcelas[0].status, 'Estorno_pendente');
      failRefundOnce = true;
      await service.processRefunds(second.id_agendamento);
      assert.equal((await tx.pagamento_transacao.findUnique({ where: { id_pagamento: '1004' } })).estorno_pendente, true);
      await service.processRefunds(second.id_agendamento);
      assert.equal((await service.get(second.id_agendamento, clientAuth)).parcelas[0].status, 'Estornado');
      await service.processRefunds(second.id_agendamento);
      assert.equal(refunds, 2, 'Repetir o processamento não duplica estorno');
      // Uma aprovação tardia depois do cancelamento também é devolvida.
      approved('1005', secondEntry); await service.reconcile('1005');
      await service.processRefunds(second.id_agendamento);
      assert.equal(refunds, 3);
      throw rollback;
    }, { timeout: 45000, isolationLevel: 'ReadCommitted' }), (error) => error === rollback);
  } finally { await prisma.$disconnect(); }
});

// Diagnóstico somente leitura: compara parcelas locais com a resposta autenticada do provedor.
// Não confirma pagamento, altera status, cria cobrança nem solicita estorno.
import 'dotenv/config';
import prisma from '../src/lib/prisma.js';
import { MercadoPagoClient } from '../src/services/pagamento/MercadoPagoClient.js';
import { cents } from '../src/services/pagamento/paymentPolicy.js';

try {
  const amount = process.argv.find((arg) => arg.startsWith('--amount='))?.slice(9);
  const appointment = process.argv.find((arg) => arg.startsWith('--appointment='))?.slice(14);
  if (!amount && !appointment) throw new Error('Informe --amount=VALOR ou --appointment=ID.');
  if (appointment && !/^\d+$/.test(appointment)) throw new Error('Agendamento inválido.');
  const provider = new MercadoPagoClient();
  const config = provider.config();
  const account = await provider.request('/users/me');
  const verifiedTestAccount = account.tags?.includes('test_user') === true && String(account.id) === config.collectorId;
  console.log(JSON.stringify({ conta_vendedora_teste: account.tags?.includes('test_user') === true, conta_configurada_confere: String(account.id) === config.collectorId }));
  const installments = await prisma.pagamento_parcela.findMany({
    where: { id_preferencia: { not: null }, ...(amount ? { valor_centavos: cents(amount) } : {}), ...(appointment ? { id_agendamento: Number(appointment) } : {}) },
    orderBy: { atualizado_em: 'desc' }, take: 5,
    include: { agendamento: { select: { status: true } } },
  });
  for (const installment of installments) {
    const result = await provider.searchPayments(installment.id_parcela);
    console.log(JSON.stringify({ id_agendamento: installment.id_agendamento, status_agendamento: installment.agendamento.status, fase: installment.fase, status_local: installment.status, pagamentos_encontrados: result.results?.length || 0 }));
    for (const item of (result.results || []).slice(0, 5)) {
      const payment = await provider.getPayment(String(item.id));
      const matches = {
        conta_recebedora: String(payment.collector_id) === config.collectorId,
        moeda: payment.currency_id === 'BRL',
        ambiente_live_mode: payment.live_mode === config.production || (!config.production && payment.live_mode === true && verifiedTestAccount),
        valor: cents(payment.transaction_amount) === installment.valor_centavos,
        referencia: payment.external_reference === installment.id_parcela,
        metadado_parcela: payment.metadata?.diaria_certa_parcela === installment.id_parcela,
        metadado_agendamento: Number(payment.metadata?.diaria_certa_agendamento) === installment.id_agendamento,
        metadado_fase: payment.metadata?.diaria_certa_fase === installment.fase,
      };
      console.log(JSON.stringify({ id_agendamento: installment.id_agendamento, fase: installment.fase, id_pagamento: String(payment.id), status: payment.status, live_mode: payment.live_mode, divergencias: Object.keys(matches).filter((field) => !matches[field]) }));
    }
  }
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
} finally { await prisma.$disconnect(); }

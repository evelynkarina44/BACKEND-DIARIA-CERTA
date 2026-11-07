// Recupera somente um pagamento de teste já aprovado e vinculado à parcela informada.
// Não cria cobrança, não executa checkout da diária e não processa a fila de estornos.
import 'dotenv/config';
import prisma from '../src/lib/prisma.js';
import { PaymentService } from '../src/services/pagamento/PaymentService.js';
import { MercadoPagoClient } from '../src/services/pagamento/MercadoPagoClient.js';

try {
  const appointmentId = process.argv.find((arg) => arg.startsWith('--appointment='))?.slice(14);
  const paymentId = process.argv.find((arg) => arg.startsWith('--payment='))?.slice(10);
  if (!/^\d+$/.test(appointmentId || '') || !/^\d+$/.test(paymentId || '')) throw new Error('Informe --appointment=ID e --payment=ID válidos.');
  const provider = new MercadoPagoClient();
  if (provider.config().production) throw new Error('Este utilitário é exclusivo para pagamentos de teste.');
  await provider.assertTestAccount();
  const payment = await provider.getPayment(paymentId);
  if (String(payment.id) !== paymentId || payment.status !== 'approved') throw new Error('O pagamento informado não está aprovado no Mercado Pago.');
  const installment = await prisma.pagamento_parcela.findUnique({
    where: { id_parcela: payment.external_reference || '' },
    include: { agendamento: { include: { checkin_checkout: true } }, transacoes: true },
  });
  if (!installment || installment.id_agendamento !== Number(appointmentId)) throw new Error('Pagamento não pertence ao agendamento informado.');
  const validPhase = installment.fase === 'Entrada'
    ? ['Aceito', 'Em_andamento', 'Concluido'].includes(installment.agendamento.status)
    : installment.agendamento.status === 'Concluido' && installment.agendamento.checkin_checkout[0]?.horario_checkout;
  if (!validPhase) throw new Error('Agendamento fora da fase válida. Nenhuma sincronização foi feita.');
  if (installment.transacoes.some((item) => item.id_pagamento !== paymentId && item.status === 'approved' && item.estornado_centavos < item.valor_centavos)) {
    throw new Error('Há outra aprovação nesta parcela. Revise a duplicidade antes de sincronizar.');
  }
  if (installment.transacoes.some((item) => item.estorno_pendente)) throw new Error('Parcela com estorno pendente. Revise antes de sincronizar.');
  const service = new PaymentService(prisma, provider);
  // Usa todas as validações normais e uma nova consulta autenticada ao provedor.
  await service.reconcile(paymentId);
  const updated = await prisma.pagamento_parcela.findMany({
    where: { id_agendamento: Number(appointmentId) }, select: { fase: true, valor_centavos: true, status: true }, orderBy: { fase: 'asc' },
  });
  console.log(JSON.stringify({ id_agendamento: Number(appointmentId), parcelas: updated.map((item) => ({ fase: item.fase, valor: item.valor_centavos / 100, status: item.status })), nova_cobranca: false, estorno_solicitado: false }));
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
} finally { await prisma.$disconnect(); }

import test from 'node:test';
import assert from 'node:assert/strict';
import { CheckinCheckoutWorkflowService } from '../src/services/checkinCheckout/CheckinCheckoutWorkflowService.js';
import { CheckinExpirationService, expireCheckinLocked } from '../src/services/agendamento/CheckinExpirationService.js';
import { checkinDeadline, checkinExpired, CHECKIN_EXPIRATION_REASON } from '../src/services/agendamento/checkinExpirationPolicy.js';
import { PaymentService } from '../src/services/pagamento/PaymentService.js';
import { notificationEvents } from '../src/services/notificacao/notificationEvents.js';
import { checkinExpirationInfo, confirmationDeadline, CLIENT_CONFIRMATION_EXPIRATION_REASON } from '../src/services/agendamento/checkinExpirationPolicy.js';

function fixture(paid = true) {
  const appointment = {
    id_agendamento: 44, id_cliente: 2, id_diarista: 8, status: 'Aceito', valor_estimado: 100,
    data_agendamento: new Date('2026-11-11T00:00:00Z'), horario_inicio: new Date('1970-01-01T08:00:00Z'),
    solicitado_em: new Date('2026-11-10T00:00:00Z'), respondido_em: new Date('2026-11-10T01:00:00Z'),
    checkin_checkout: [], ocorrencia_agendamento: [],
    pagamento_parcela: [
      { fase: 'Entrada', status: paid ? 'Pago' : 'Pendente', valor_centavos: 5000, transacoes: paid ? [{ status: 'approved', estorno_pendente: false }] : [] },
      { fase: 'Saldo', status: 'Pendente', valor_centavos: 5000, transacoes: [] },
    ],
  };
  let now = new Date('2026-11-11T11:30:00Z'), tail = Promise.resolve();
  const db = {
    $queryRaw: async () => [],
    agendamento: { findUnique: async () => appointment, findMany: async () => [{ id_agendamento: 44 }], update: async ({ data }) => Object.assign(appointment, data) },
    ocorrencia_agendamento: { create: async ({ data }) => { appointment.ocorrencia_agendamento.push(data); } },
    pagamento_transacao: { updateMany: async ({ where, data }) => {
      assert.equal(where.parcela.fase, 'Entrada');
      for (const item of appointment.pagamento_parcela[0].transacoes) if (item.status === where.status) Object.assign(item, data);
    } },
    pagamento_parcela: { updateMany: async ({ where, data }) => {
      for (const item of appointment.pagamento_parcela) if (item.fase === where.fase && item.status === where.status) Object.assign(item, data);
    } },
    checkin_checkout: {
      create: async ({ data }) => { const row = { id_check: 1, ...data }; appointment.checkin_checkout.push(row); return row; },
      update: async ({ data }) => Object.assign(appointment.checkin_checkout[0], data),
    },
  };
  db.$transaction = callback => { const result = tail.then(() => callback(db)); tail = result.catch(() => {}); return result; };
  return { appointment, db, setNow: value => { now = value; }, now: () => now, workflow: new CheckinCheckoutWorkflowService(db, () => now) };
}

test('tolerância em Brasília: 29min59s ainda permite, 30 minutos encerra', async () => {
  const f = fixture();
  assert.equal(checkinDeadline(f.appointment).toISOString(), '2026-11-11T11:30:00.000Z');
  assert.equal(checkinExpired(f.appointment, new Date('2026-11-11T11:29:59.999Z')), false);
  assert.equal(checkinExpired(f.appointment, f.now()), true);
  f.setNow(new Date('2026-11-11T11:29:59.999Z'));
  await f.workflow.requestCheckin(44, { id_diarista: 8 });
  await f.workflow.confirmCheckin(44, { id_cliente: 2 });
  f.setNow(new Date('2026-11-12T15:00:00Z'));
  assert.equal(await expireCheckinLocked(f.db, f.appointment, f.now()), false);
  assert.equal((await f.workflow.checkout(44, { id_diarista: 8 })).status_checkin, 'Finalizado');
});

test('check-in tardio confirma expiração antes de retornar erro e agenda estorno integral da entrada', async () => {
  const f = fixture();
  await assert.rejects(() => f.workflow.requestCheckin(44, { id_diarista: 8 }), /Check-in expirado/);
  assert.equal(f.appointment.status, 'Expirado');
  assert.equal(f.appointment.checkin_checkout.length, 0);
  assert.equal(f.appointment.ocorrencia_agendamento[0].descricao, CHECKIN_EXPIRATION_REASON);
  assert.equal(f.appointment.pagamento_parcela[0].status, 'Estorno_pendente');
  assert.equal(f.appointment.pagamento_parcela[0].transacoes[0].estorno_pendente, true);
  assert.equal(f.appointment.pagamento_parcela[1].status, 'Pendente');
  await assert.rejects(() => f.workflow.requestCheckin(44, { id_diarista: 8 }), /Check-in expirado/);
  assert.equal(f.appointment.ocorrencia_agendamento.length, 1);
});

test('entrada pendente também expira, mas não inventa pagamento nem estorno', async () => {
  const f = fixture(false);
  await new CheckinExpirationService(f.db, f.now).run();
  assert.equal(f.appointment.status, 'Expirado');
  assert.equal(f.appointment.pagamento_parcela[0].status, 'Pendente');
  assert.equal(f.appointment.pagamento_parcela[0].transacoes.length, 0);
});

test('tarefas repetidas ou concorrentes não duplicam a expiração ou o pedido de estorno', async () => {
  const f = fixture();
  const job = new CheckinExpirationService(f.db, f.now);
  await Promise.all([job.run(), job.run()]);
  assert.equal(f.appointment.ocorrencia_agendamento.length, 1);
  assert.equal(f.appointment.pagamento_parcela[0].valor_centavos, 5000);
});

test('não expira diária iniciada, concluída, cancelada ou legado sem horário', async () => {
  for (const status of ['Em_andamento', 'Concluido', 'Cancelado', 'Pendente']) {
    const f = fixture(); f.appointment.status = status;
    assert.equal(await expireCheckinLocked(f.db, f.appointment, f.now()), false);
  }
  const f = fixture(); f.appointment.horario_inicio = null;
  assert.equal(await expireCheckinLocked(f.db, f.appointment, f.now()), false);
  assert.equal(f.appointment.ocorrencia_agendamento.length, 0);
});

test('pagamento e notificação distinguem check-in expirado de solicitação sem aceite', async () => {
  const f = fixture();
  await new CheckinExpirationService(f.db, f.now).run();
  const summary = new PaymentService(f.db).summary(f.appointment);
  assert.equal(summary.checkin_expirado, true);
  assert.equal(summary.parcelas.some(item => item.pode_pagar), false);
  assert.equal(summary.parcelas[0].status, 'Estorno_pendente');
  const events = notificationEvents(f.appointment, 'CLIENTE', f.now());
  assert.ok(events.some(item => item.titulo === 'Check-in expirado'));
  assert.equal(events.some(item => item.tipo === 'horario-checkin'), false);
});

test('aprovação que chega depois do prazo entra na fila de estorno, mesmo antes da tarefa de expiração', async () => {
  const f = fixture(false);
  f.appointment.data_agendamento = new Date('2000-01-01T00:00:00Z');
  const known = { id_parcela: 'parcela-teste', id_agendamento: 44, fase: 'Entrada', valor_centavos: 5000 };
  const transactions = [];
  f.db.pagamento_parcela.findUnique = async () => known;
  f.db.pagamento_parcela.findMany = async () => f.appointment.pagamento_parcela;
  f.db.pagamento_parcela.update = async ({ data }) => Object.assign(f.appointment.pagamento_parcela[0], data);
  f.db.pagamento_transacao.findUnique = async () => null;
  f.db.pagamento_transacao.upsert = async ({ create }) => { transactions.push({ ...create, estorno_pendente: false }); };
  f.db.pagamento_transacao.findMany = async () => transactions;
  f.db.pagamento_transacao.update = async ({ data }) => Object.assign(transactions[0], data);
  f.db.checkin_checkout.updateMany = async ({ data }) => assert.equal(data.status_pagamento, 'Pendente');
  const service = new PaymentService(f.db, { config: () => ({ collectorId: 'vendedor-teste', production: false }) });
  assert.equal(service.summary(f.appointment).parcelas[0].pode_pagar, false);
  await service.applyPayment({
    id: 'pagamento-teste', external_reference: known.id_parcela, collector_id: 'vendedor-teste', currency_id: 'BRL', transaction_amount: 50,
    status: 'approved', live_mode: false, date_last_updated: new Date().toISOString(),
    metadata: { diaria_certa_parcela: known.id_parcela, diaria_certa_agendamento: 44, diaria_certa_fase: 'Entrada' },
  });
  assert.equal(transactions[0].estorno_pendente, true);
  assert.equal(f.appointment.pagamento_parcela[0].status, 'Estorno_pendente');
});

test('chegada no prazo protege contra expiração original; cliente inicia depois do prazo original, dentro de sua janela', async () => {
  const f = fixture();
  f.setNow(new Date('2026-11-11T11:29:00Z'));
  await f.workflow.requestCheckin(44, { id_diarista: 8 });
  assert.equal(f.appointment.status, 'Aceito');
  assert.equal(f.appointment.checkin_checkout[0].horario_checkin, undefined);
  assert.equal(confirmationDeadline(f.appointment).toISOString(), '2026-11-11T11:59:00.000Z');
  f.setNow(new Date('2026-11-11T11:31:00Z'));
  await new CheckinExpirationService(f.db, f.now).run();
  assert.equal(f.appointment.status, 'Aceito');
  assert.equal(checkinExpired(f.appointment, f.now()), false);
  await assert.rejects(() => f.workflow.checkout(44, { id_diarista: 8 }), /não foi iniciado/);
  await f.workflow.confirmCheckin(44, { id_cliente: 2 });
  assert.equal(f.appointment.status, 'Em_andamento');
  assert.equal(f.appointment.checkin_checkout[0].horario_checkin.toISOString(), '2026-11-11T11:31:00.000Z');
  assert.equal(f.appointment.pagamento_parcela[1].status, 'Pendente');
});

test('cliente sem resposta encerra como cancelamento por falta de confirmação e agenda estorno integral, não ausência', async () => {
  const f = fixture();
  f.setNow(new Date('2026-11-11T11:00:00Z'));
  await f.workflow.requestCheckin(44, { id_diarista: 8 });
  f.setNow(new Date('2026-11-11T11:10:00Z'));
  await f.workflow.requestCheckin(44, { id_diarista: 8 });
  assert.equal(confirmationDeadline(f.appointment).toISOString(), '2026-11-11T11:30:00.000Z', 'clique repetido não adia o prazo');
  f.setNow(new Date('2026-11-11T11:30:00Z'));
  await assert.rejects(() => f.workflow.confirmCheckin(44, { id_cliente: 2 }), /Confirmação do cliente expirada/);
  assert.equal(f.appointment.status, 'Cancelado');
  assert.equal(f.appointment.ocorrencia_agendamento[0].descricao, CLIENT_CONFIRMATION_EXPIRATION_REASON);
  assert.equal(f.appointment.pagamento_parcela[0].status, 'Estorno_pendente');
  assert.equal(f.appointment.pagamento_parcela[0].transacoes[0].estorno_pendente, true);
  const info = checkinExpirationInfo(f.appointment, f.now());
  assert.equal(info.checkin_expirado, false);
  assert.equal(info.confirmacao_cliente_expirada, true);
  const events = notificationEvents(f.appointment, 'CLIENTE', f.now());
  assert.ok(events.some(event => event.tipo === 'confirmacao-expirada'));
  assert.equal(events.some(event => event.tipo === 'checkin-expirado'), false);
  await new CheckinExpirationService(f.db, f.now).run();
  assert.equal(f.appointment.ocorrencia_agendamento.length, 1);
});

test('chegada sem entrada paga é permitida, mas confirmação e início permanecem bloqueados', async () => {
  const f = fixture(false);
  f.setNow(new Date('2026-11-11T11:00:00Z'));
  await f.workflow.requestCheckin(44, { id_diarista: 8 });
  await assert.rejects(() => f.workflow.confirmCheckin(44, { id_cliente: 2 }), /entrada de 50%/);
  assert.equal(f.appointment.status, 'Aceito');
  assert.equal(f.appointment.checkin_checkout[0].horario_checkin, undefined);
  const events = notificationEvents(f.appointment, 'CLIENTE', f.now());
  assert.equal(events.find(event => event.tipo === 'chegada').acao, 'pagamento');
  f.appointment.pagamento_parcela[0].status = 'Pago';
  const paidEvents = notificationEvents(f.appointment, 'CLIENTE', f.now());
  assert.equal(paidEvents.find(event => event.tipo === 'chegada').acao, 'checkin');
  await f.workflow.confirmCheckin(44, { id_cliente: 2 });
  assert.equal(f.appointment.status, 'Em_andamento');
});

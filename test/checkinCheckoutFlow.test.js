import test from 'node:test';
import assert from 'node:assert/strict';
import { CheckinCheckoutWorkflowService } from '../src/services/checkinCheckout/CheckinCheckoutWorkflowService.js';
import { PaymentService } from '../src/services/pagamento/PaymentService.js';
import { combineDateAndTime } from '../src/utils/dateTime.js';

function fixture() {
  const appointment = {
    id_agendamento: 40, id_cliente: 2, id_diarista: 3, status: 'Aceito', valor_estimado: 120,
    data_agendamento: new Date('2026-11-10T00:00:00Z'), horario_inicio: new Date('1970-01-01T08:00:00Z'),
    pagamento_parcela: [{ fase: 'Entrada', status: 'Pago', valor_centavos: 6000, transacoes: [] }, { fase: 'Saldo', status: 'Pendente', valor_centavos: 6000, transacoes: [] }],
    checkin_checkout: [],
  };
  let now = combineDateAndTime(appointment.data_agendamento, appointment.horario_inicio);
  const database = {
    $queryRaw: async () => [],
    agendamento: {
      findUnique: async () => appointment,
      update: async ({ data }) => Object.assign(appointment, data),
    },
    checkin_checkout: {
      create: async ({ data }) => { const check = { id_check: 1, ...data }; appointment.checkin_checkout.push(check); return check; },
      update: async ({ data }) => Object.assign(appointment.checkin_checkout[0], data),
    },
  };
  database.$transaction = async callback => callback(database);
  return { appointment, database, service: new CheckinCheckoutWorkflowService(database, () => new Date(now)), worker: { id_diarista: 3 }, setNow: date => { now = date; } };
}

test('check-in bloqueado antes do horário; liberado exatamente no início agendado', async () => {
  const f = fixture();
  const start = combineDateAndTime(f.appointment.data_agendamento, f.appointment.horario_inicio);
  f.setNow(new Date(start.getTime() - 1));
  await assert.rejects(() => f.service.requestCheckin(40, f.worker), /a partir do horário/);
  assert.equal(f.appointment.checkin_checkout.length, 0);
  f.setNow(start);
  const check = await f.service.requestCheckin(40, f.worker);
  assert.equal(check.status_checkin, 'Checkin_solicitado');
  assert.equal(check.horario_chegada.getTime(), start.getTime());
  assert.equal(check.horario_checkin, undefined);
  assert.equal(check.status_pagamento, 'Pendente');
  assert.equal(f.appointment.status, 'Aceito');
  await f.service.confirmCheckin(40, { id_cliente: 2 });
  assert.equal(check.horario_checkin.getTime(), start.getTime());
  assert.equal(f.appointment.status, 'Em_andamento');
});

test('chegada exige aceite e diarista titular; início exige entrada aprovada e cliente titular', async () => {
  const f = fixture();
  await assert.rejects(() => f.service.requestCheckin(40, { id_cliente: 2 }), /Somente a diarista/);
  await assert.rejects(() => f.service.requestCheckin(40, { id_diarista: 99 }), /não pertence/);
  f.appointment.pagamento_parcela[0].status = 'Pendente';
  await f.service.requestCheckin(40, f.worker);
  assert.equal(f.appointment.status, 'Aceito');
  await assert.rejects(() => f.service.confirmCheckin(40, { id_cliente: 2 }), /entrada de 50%/);
  await assert.rejects(() => f.service.confirmCheckin(40, f.worker), /Somente o cliente/);
  f.appointment.pagamento_parcela[0].status = 'Pago';
  for (const status of ['Pendente', 'Recusado', 'Cancelado', 'Expirado', 'Concluido']) {
    f.appointment.status = status;
    await assert.rejects(() => f.service.requestCheckin(40, f.worker), /precisa estar aceito/);
  }
});

test('repetir check-in não duplica registros nem muda o horário inicial', async () => {
  const f = fixture();
  const first = await f.service.requestCheckin(40, f.worker);
  const arrivalTime = first.horario_chegada.getTime();
  const initialTime = arrivalTime + 60000;
  f.setNow(new Date(initialTime));
  await f.service.requestCheckin(40, f.worker);
  await f.service.confirmPayment(40, { id_cliente: 2 });
  assert.equal(f.appointment.checkin_checkout.length, 1);
  assert.equal(first.horario_checkin.getTime(), initialTime);
  assert.equal(first.horario_chegada.getTime(), arrivalTime);
  f.setNow(new Date(initialTime + 60000));
  await f.service.confirmCheckin(40, { id_cliente: 2 });
  assert.equal(first.horario_checkin.getTime(), initialTime);
});

test('solicitação antiga recebe chegada e ainda exige confirmação do cliente', async () => {
  const f = fixture();
  f.appointment.checkin_checkout.push({ id_check: 1, status_checkin: 'Checkin_solicitado' });
  await f.service.requestCheckin(40, f.worker);
  assert.equal(f.appointment.checkin_checkout.length, 1);
  assert.equal(f.appointment.checkin_checkout[0].status_checkin, 'Checkin_solicitado');
  assert.equal(f.appointment.status, 'Aceito');
});

test('checkout só após início, pela diarista; libera saldo sem marcá-lo como pago', async () => {
  const f = fixture();
  const payment = new PaymentService(f.database);
  await assert.rejects(() => f.service.checkout(40, f.worker), /não foi iniciado/);
  await f.service.requestCheckin(40, f.worker);
  await assert.rejects(() => f.service.checkout(40, f.worker), /não foi iniciado/);
  await f.service.confirmCheckin(40, { id_cliente: 2 });
  await assert.rejects(() => f.service.checkout(40, { id_cliente: 2 }), /Somente a diarista/);
  assert.equal(payment.summary(f.appointment).parcelas[1].pode_pagar, false);
  const end = new Date(combineDateAndTime(f.appointment.data_agendamento, f.appointment.horario_inicio).getTime() + 4 * 3600000);
  f.setNow(end);
  const check = await f.service.checkout(40, f.worker);
  assert.equal(f.appointment.status, 'Concluido');
  assert.equal(check.status_checkin, 'Finalizado');
  assert.equal(check.horario_checkout.getTime(), end.getTime());
  const summary = payment.summary(f.appointment);
  assert.equal(summary.parcelas[1].pode_pagar, true);
  assert.equal(summary.parcelas[1].status, 'Pendente');
  assert.equal(summary.quitado, false);
  assert.equal(check.status_pagamento, 'Pendente');
  f.setNow(new Date(end.getTime() + 60000));
  await f.service.checkout(40, f.worker);
  assert.equal(check.horario_checkout.getTime(), end.getTime());
});

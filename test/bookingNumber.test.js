import test from 'node:test';
import assert from 'node:assert/strict';
import { nextWorkerBookingNumber } from '../src/services/agendamento/bookingNumber.js';
import { notificationEvents } from '../src/services/notificacao/notificationEvents.js';

test('contador é independente por diarista e não usa ID global nem posição na página', async () => {
  const counters = new Map([[8, 0], [9, 5]]);
  const database = { diarista: { update: async ({where,data,select}) => {
    assert.equal(data.ultimo_numero_diaria.increment, 1);
    assert.equal(select.ultimo_numero_diaria, true);
    const next = counters.get(where.id_diarista) + 1;
    counters.set(where.id_diarista, next);
    return { ultimo_numero_diaria: next };
  } } };
  assert.equal(await nextWorkerBookingNumber(database,8),1);
  assert.equal(await nextWorkerBookingNumber(database,9),6);
  assert.equal(await nextWorkerBookingNumber(database,8),2);
  const numbers = await Promise.all(Array.from({length:20},()=>nextWorkerBookingNumber(database,8)));
  assert.equal(new Set(numbers).size,20);
  assert.equal(counters.get(8),22);
});

test('falha na transação não consome o número; o contador permanece após remover registros', async () => {
  let counter = 0;
  const tx = { diarista: { update:async()=>({ultimo_numero_diaria:++counter}) } };
  const transaction = async fn => { const previous=counter; try{return await fn(tx);}catch(error){counter=previous;throw error;} };
  await assert.rejects(()=>transaction(async database => {await nextWorkerBookingNumber(database,8);throw Error('Gravação falhou');}));
  assert.equal(counter,0);
  assert.equal(await transaction(database=>nextWorkerBookingNumber(database,8)),1);
  // Mesmo sem consultar registros restantes, o contador conserva seu valor máximo.
  assert.equal(await transaction(database=>nextWorkerBookingNumber(database,8)),2);
});

test('aviso para diarista usa número próprio, preservando ID global e chave de leitura', () => {
  const appointment={id_agendamento:12,numero_diarista:1,status:'Pendente',data_agendamento:new Date('2099-01-01'),solicitado_em:new Date('2026-01-01')};
  const worker=notificationEvents(appointment,'DIARISTA',new Date('2026-01-02'))[0];
  const client=notificationEvents(appointment,'CLIENTE',new Date('2026-01-02'))[0];
  assert.match(worker.mensagem,/Diária #1 de/);
  assert.match(client.mensagem,/Diária #12 de/);
  assert.equal(worker.id_agendamento,12);
  assert.equal(notificationEvents({...appointment,numero_diarista:2},'DIARISTA',new Date('2026-01-02'))[0].id,worker.id);
});

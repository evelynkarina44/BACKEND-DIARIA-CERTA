import test from 'node:test';
import assert from 'node:assert/strict';
import { notificationEvents } from '../src/services/notificacao/notificationEvents.js';
import { NotificationService } from '../src/services/notificacao/NotificationService.js';

const now = new Date('2026-11-02T12:00:00Z');
function fixture() {
  const appointment = {
    id_agendamento: 44, status: 'Concluido', data_agendamento: new Date('2026-11-01T00:00:00Z'), horario_inicio: new Date('1970-01-01T08:00:00Z'),
    solicitado_em: new Date('2026-10-31T10:00:00Z'), respondido_em: new Date('2026-10-31T11:00:00Z'), avaliacao: [],
    checkin_checkout: [{ horario_checkin: new Date('2026-11-01T11:00:00Z'), horario_checkout: new Date('2026-11-01T15:00:00Z') }],
    pagamento_parcela: ['Entrada', 'Saldo'].map((fase, index) => ({ fase, status: 'Pago', atualizado_em: new Date('2026-11-01T16:00:00Z'),
      transacoes: [{ status: 'approved', criado_em: new Date(index ? '2026-11-01T16:00:00Z' : '2026-10-31T12:00:00Z'), estorno_pendente: false, estornado_centavos: 0, valor_centavos: 3500 }] })),
  };
  const reads = new Map(), calls = [], writes = [];
  const database = {
    agendamento: { findMany: async args => { calls.push(args); return [appointment]; } },
    $queryRaw: async query => [...(reads.get(query.values[0] + ':' + query.values[1]) ?? [])].map(chave_evento => ({ chave_evento })),
    $executeRaw: async query => {
      writes.push(query);
      for (let i = 0; i < query.values.length; i += 3) {
        const key = query.values[i] + ':' + query.values[i + 1];
        if (!reads.has(key)) reads.set(key, new Set());
        reads.get(key).add(query.values[i + 2]);
      }
    },
  };
  return { appointment, reads, calls, writes, database, service: new NotificationService(database, () => now), customer: { id_usuario: 10, activeProfile: 'CLIENTE', id_cliente: 2 }, worker: { id_usuario: 20, activeProfile: 'DIARISTA', id_diarista: 3 } };
}

test('eventos têm IDs estáveis; repetição da consulta não duplica nem muda a leitura', () => {
  const f = fixture();
  const first = notificationEvents(f.appointment, 'CLIENTE', now);
  assert.deepEqual(notificationEvents(f.appointment, 'CLIENTE', now), first);
  assert.equal(new Set(first.map(e => e.id)).size, first.length);
  assert.ok(first.some(e => e.tipo === 'checkin'));
  assert.ok(first.some(e => e.tipo === 'checkout'));
  assert.equal(first.find(e => e.tipo === 'Saldo-pago').acao, 'avaliacao');
  f.appointment.pagamento_parcela[0].atualizado_em = now;
  assert.equal(notificationEvents(f.appointment, 'CLIENTE', now).find(e => e.tipo === 'Entrada-pago').id, first.find(e => e.tipo === 'Entrada-pago').id);
  assert.equal(notificationEvents(f.appointment, 'CLIENTE', now).find(e => e.tipo === 'Entrada-pago').criado_em, first.find(e => e.tipo === 'Entrada-pago').criado_em);
});

test('não inventa aprovação por existir checkout e não antecipa lembrete de check-in', () => {
  const f = fixture();
  f.appointment.pagamento_parcela[1].status = 'Pendente';
  assert.equal(notificationEvents(f.appointment, 'CLIENTE', now).some(e => e.tipo === 'Saldo-pago'), false);
  f.appointment.status = 'Aceito'; f.appointment.checkin_checkout = [];
  const before = new Date('2026-11-01T10:59:59Z');
  assert.equal(notificationEvents(f.appointment, 'DIARISTA', before).some(e => e.tipo === 'horario-checkin'), false);
  assert.equal(notificationEvents(f.appointment, 'DIARISTA', now).some(e => e.tipo === 'horario-checkin'), true);
});

test('leitura persiste por usuário e perfil; marcar todas não afeta outra pessoa', async () => {
  const f = fixture();
  const before = await f.service.list({}, f.customer);
  assert.equal(before.nao_lidas, before.data.length);
  await f.service.markRead(before.data[0].id, f.customer);
  const after = await new NotificationService(f.database, () => now).list({}, f.customer);
  assert.equal(after.nao_lidas, before.nao_lidas - 1);
  assert.equal(after.data.find(e => e.id === before.data[0].id).lida, true);
  assert.equal((await f.service.list({}, f.worker)).nao_lidas, before.nao_lidas);
  await f.service.markAll(f.customer);
  assert.equal((await f.service.list({}, f.customer)).nao_lidas, 0);
  assert.equal((await f.service.list({}, f.worker)).nao_lidas, before.nao_lidas);
  assert.ok(f.writes.every(query => query.sql.includes('INSERT INTO notificacao_leitura')));
});

test('somente participantes do perfil ativo consultam e IDs de outro perfil não podem ser marcados', async () => {
  const f = fixture();
  for (const auth of [null, {}, { id_usuario: 10, id_cliente: 2 }, { id_usuario: 10, activeProfile: 'DIARISTA', id_cliente: 2 }]) await assert.rejects(() => f.service.list({}, auth), e => e.statusCode === 403);
  const customer = await f.service.list({}, f.customer);
  assert.equal(f.calls[0].where.id_cliente, 2);
  assert.equal(f.calls[0].where.id_diarista, undefined);
  await assert.rejects(() => f.service.markRead(customer.data[0].id, f.worker), e => e.statusCode === 404);
  assert.equal(f.writes.length, 0);
});

test('contagem não lida independe da página e notificações fora de 30 dias não são mostradas', async () => {
  const f = fixture();
  const first = await f.service.list({ page: 1, limit: 2 }, f.customer);
  const second = await f.service.list({ page: 2, limit: 2 }, f.customer);
  assert.equal(first.nao_lidas, second.nao_lidas);
  assert.equal(first.data.length, 2);
  assert.notEqual(first.data[0].id, second.data[0].id);
  f.appointment.solicitado_em = new Date('2026-01-01T00:00:00Z');
  assert.equal((await f.service.list({}, f.customer)).data.some(e => e.tipo === 'solicitacao'), false);
});

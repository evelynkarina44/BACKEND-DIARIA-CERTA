import test from 'node:test';
import assert from 'node:assert/strict';
import { AgendamentoWorkflowService } from '../src/services/agendamento/AgendamentoWorkflowService.js';

function fixture() {
  const rows = [
    { id_agendamento: 1, id_cliente: 2, id_diarista: 8, status: 'Concluido', valor_estimado: 100, avaliacao: [{ id_avaliacao: 5, autor_tipo: 'Cliente', nota: { toString: () => '3.5' }, comentario: 'Chegou no horário e limpou bem.', anonima: false }] },
    { id_agendamento: 2, id_cliente: 2, id_diarista: 8, status: 'Concluido', valor_estimado: 100, avaliacao: [] },
  ];
  const calls = [];
  const service = new AgendamentoWorkflowService({ agendamento: {
    updateMany: async () => ({}),
    findMany: async args => { calls.push(args); return rows; },
    count: async () => rows.length,
    findUnique: async args => { calls.push(args); return rows[0]; },
  } });
  return { service, calls, rows };
}

test('histórico inclui nota numérica e comentário do cliente por agendamento', async () => {
  const f = fixture();
  const result = await f.service.list({ visao: 'todos' }, { id_diarista: 8 });
  assert.equal(result.data[0].avaliacao[0].nota, 3.5);
  assert.equal(result.data[0].avaliacao[0].comentario, 'Chegou no horário e limpou bem.');
  assert.deepEqual(result.data[1].avaliacao, []);
  assert.deepEqual(f.calls[0].include.avaliacao.where, { autor_tipo: 'Cliente' });
  assert.equal(f.calls[0].include.avaliacao.select.comentario, true);
  assert.equal(f.calls[0].include.avaliacao.select.id_cliente, undefined);
  assert.equal(f.calls[0].include.avaliacao.select.id_diarista, undefined);
  assert.deepEqual(f.calls[0].where.OR, [{ id_diarista: 8 }]);
});

test('detalhes também trazem avaliação; agendamento privado continua restrito aos participantes', async () => {
  const f = fixture();
  f.rows[0].avaliacao[0].anonima = true;
  const result = await f.service.find(1, { id_diarista: 8 });
  assert.equal(result.avaliacao[0].nota, 3.5);
  assert.equal(result.avaliacao[0].anonima, true);
  assert.equal(result.avaliacao[0].id_cliente, undefined);
  await assert.rejects(() => f.service.find(1, { id_diarista: 99 }), (error) => error.statusCode === 403);
  await assert.rejects(() => f.service.list({}, {}), (error) => error.statusCode === 403);
});

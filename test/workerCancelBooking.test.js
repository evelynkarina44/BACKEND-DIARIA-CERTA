import test from 'node:test';
import assert from 'node:assert/strict';
import { AgendamentoWorkflowService } from '../src/services/agendamento/AgendamentoWorkflowService.js';
import { findBookingConflict } from '../src/services/agendamento/availabilityPolicy.js';

function fixture(status = 'Aceito') {
  let row = { id_agendamento: 44, id_cliente: 2, id_diarista: 8, status, valor_estimado: 100, data_agendamento: new Date('2099-01-12'), horario_inicio: new Date('1970-01-01T09:00:00Z'), horario_fim: new Date('1970-01-01T10:00:00Z') };
  const writes = [], locks = [];
  const tx = {
    $queryRaw: async (...args) => { locks.push(args); },
    agendamento: {
      findUnique: async () => row,
      findMany: async ({ where }) => where.status.in.includes(row.status) ? [row] : [],
      update: async ({ data }) => { writes.push(['agendamento', data]); row = { ...row, ...data }; return row; },
    },
    pagamento_transacao: { updateMany: async args => { writes.push(['transacoes', args]); } },
    pagamento_parcela: { updateMany: async args => { writes.push(['parcelas', args]); } },
    ocorrencia_agendamento: { create: async args => { writes.push(['ocorrencia', args]); } },
  };
  const service = new AgendamentoWorkflowService({ $transaction: async callback => callback(tx) });
  return { service, tx, writes, locks, row: () => row };
}

test('diarista titular pode cancelar diária aceita e o horário deixa de ser bloqueado', async () => {
  const f = fixture();
  assert.ok(await findBookingConflict(f.tx, f.row()));
  const canceled = await f.service.cancel(44, { id_diarista: 8 }, 'Imprevisto da diarista');
  assert.equal(canceled.status, 'Cancelado');
  assert.equal(f.locks.length, 1, 'cancelamento disputa a mesma trava do check-in');
  assert.equal(await findBookingConflict(f.tx, f.row()), undefined);
  assert.deepEqual(f.writes.find(([name]) => name === 'ocorrencia')[1].data, { id_agendamento: 44, motivo: 'cancelamento', descricao: 'Imprevisto da diarista' });
});

test('cancelamento pela diarista agenda estorno apenas de pagamentos aprovados, sem chamar o provedor', async () => {
  const f = fixture();
  await f.service.cancel(44, { id_diarista: 8 });
  assert.deepEqual(f.writes.find(([name]) => name === 'transacoes')[1], {
    where: { status: 'approved', parcela: { id_agendamento: 44 } }, data: { estorno_pendente: true },
  });
  assert.deepEqual(f.writes.find(([name]) => name === 'parcelas')[1], {
    where: { id_agendamento: 44, status: 'Pago' }, data: { status: 'Estorno_pendente' },
  });
});

test('outra diarista ou outro cliente não pode cancelar e não altera dados financeiros', async () => {
  for (const auth of [{ id_diarista: 99 }, { id_cliente: 99 }, {}]) {
    const f = fixture();
    await assert.rejects(() => f.service.cancel(44, auth), (error) => error.statusCode === 403);
    assert.equal(f.writes.length, 0);
  }
});

test('não cancela diária iniciada, concluída ou encerrada; cliente titular continua podendo cancelar antes do início', async () => {
  for (const status of ['Em_andamento', 'Concluido', 'Cancelado', 'Recusado', 'Expirado']) {
    const f = fixture(status);
    await assert.rejects(() => f.service.cancel(44, { id_diarista: 8 }), (error) => error.statusCode === 409);
    assert.equal(f.writes.length, 0);
  }
  const f = fixture();
  assert.equal((await f.service.cancel(44, { id_cliente: 2 })).status, 'Cancelado');
});

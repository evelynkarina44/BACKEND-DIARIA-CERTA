import test from 'node:test';
import assert from 'node:assert/strict';
import { AvaliacaoWorkflowService } from '../src/services/avaliacao/AvaliacaoWorkflowService.js';
import { PaymentService } from '../src/services/pagamento/PaymentService.js';
import { FindClienteService } from '../src/services/cliente/FindClienteService.js';

test('perfil do cliente calcula a nota somente pelas avaliações recebidas de diaristas', async () => {
  let options;
  const service = new FindClienteService({ findById: async (_id, query) => { options = query; return {}; } });
  await service.execute(2, { id_cliente: 2 });
  assert.deepEqual(options.include.avaliacao.where, { autor_tipo: 'Diarista' });
});

test('avaliações recebidas usam somente o perfil ativo, média global, paginação e anonimato', async () => {
  const queries = [];
  const database = { avaliacao: {
    findMany: async query => { queries.push(query); return [{ id_avaliacao: 1, nota: '4.0', comentario: 'Cuidadoso',
      anonima: true, data_avaliacao: new Date(), cliente: { usuario: { nome: 'Nome secreto' } }, diarista: { usuario: { nome: 'Nome secreto' } } }]; },
    aggregate: async query => { queries.push(query); return { _avg: { nota: '4.5' }, _count: { _all: 8 } }; },
  } };
  const service = new AvaliacaoWorkflowService(database);
  const auth = { activeProfile: 'CLIENTE', id_cliente: 2, id_diarista: 3 };
  const result = await service.received({ page: 2, limit: 5 }, auth);
  assert.deepEqual(queries[0].where, { id_cliente: 2, autor_tipo: 'Diarista' });
  assert.deepEqual(queries[0].where, queries[1].where);
  assert.equal(queries[0].skip, 5);
  assert.equal(result.media, 4.5);
  assert.equal(result.pagination.pages, 2);
  assert.equal(result.data[0].autor, 'Avaliação anônima');
  assert.ok(!JSON.stringify(result).includes('Nome secreto'));
  await service.received({}, { ...auth, activeProfile: 'DIARISTA' });
  assert.deepEqual(queries[2].where, { id_diarista: 3, autor_tipo: 'Cliente' });
  await assert.rejects(() => service.received({}, { id_cliente: 2 }), error => error.statusCode === 403);
});

test('diarista avalia cliente após checkout, sem saldo pago, sem impedir avaliação posterior do cliente', async () => {
  const appointment = { id_agendamento: 40, id_cliente: 2, id_diarista: 3, status: 'Concluido',
    valor_estimado: 120, avaliacao: [], pagamento_parcela: [
      { fase: 'Entrada', status: 'Pago', valor_centavos: 6000, transacoes: [] },
      { fase: 'Saldo', status: 'Pendente', valor_centavos: 6000, transacoes: [] },
    ] };
  const db = { $queryRaw: async () => [], agendamento: { findUnique: async () => appointment },
    avaliacao: {
      findUnique: async ({ where }) => appointment.avaliacao.find(review => review.autor_tipo === where.id_agendamento_autor_tipo.autor_tipo),
      create: async ({ data }) => { const review = { id_avaliacao: appointment.avaliacao.length + 1, ...data }; appointment.avaliacao.push(review); return review; },
      aggregate: async () => ({ _avg: { nota: 5 } }),
    }, diarista: { update: async () => {} },
  };
  db.$transaction = callback => callback(db);
  const workflow = new AvaliacaoWorkflowService(db), payments = new PaymentService(db);
  assert.equal(payments.summary(appointment).pode_avaliar_cliente, true);
  const data = { id_agendamento: 40, nota: 5, comentario: 'Cliente atencioso', publica: true, anonima: false };
  const review = await workflow.create(data, { id_diarista: 3 });
  assert.equal(review.autor_tipo, 'Diarista');
  assert.equal(payments.summary(appointment).pode_avaliar_cliente, false);
  assert.equal(payments.summary(appointment).avaliacao_cliente, null);
  assert.equal(payments.summary(appointment).avaliacao_diarista.nota, 5);
  await assert.rejects(() => workflow.create(data, { id_diarista: 3 }), /já avaliou/);
  await assert.rejects(() => workflow.create(data, { id_cliente: 2 }), /duas parcelas/);
  appointment.pagamento_parcela[1].status = 'Pago';
  assert.equal(payments.summary(appointment).pode_avaliar, true);
  await workflow.create(data, { id_cliente: 2 });
  assert.equal(appointment.avaliacao.length, 2);
  assert.equal(payments.summary(appointment).pode_avaliar, false);
  appointment.status = 'Em_andamento';
  await assert.rejects(() => workflow.create(data, { id_diarista: 3 }), /após a conclusão/);
});

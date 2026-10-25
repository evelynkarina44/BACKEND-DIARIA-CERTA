import test from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { ChatbotService } from '../src/services/chatbot/ChatbotService.js';
import { listConversationsSchema } from '../src/schemas/chatbotSchemas.js';

const auth = { id_usuario: 7, id_cliente: 3, activeProfile: 'CLIENTE' };

test('histórico valida paginação e não aceita identidade de outro cliente pela query', () => {
  assert.deepEqual(listConversationsSchema.parse({}), { page: 1, limit: 20 });
  assert.deepEqual(listConversationsSchema.parse({ page: '2', limit: '10' }), { page: 2, limit: 10 });
  for (const query of [{ page: '0' }, { page: '1.5' }, { page: 'abc' }, { limit: 51 }, { limit: -1 }, { id_cliente: 999 }, { page: 100001 }]) {
    assert.equal(listConversationsSchema.safeParse(query).success, false);
  }
});

test('lista somente conversas do cliente autenticado, com paginação e projeção resumida', async () => {
  let selected;
  let counted;
  const id = randomUUID();
  const date = new Date();
  const database = { chatbot_conversa: {
    findMany: async (query) => {
      selected = query;
      return [
        { id_conversa: id, criado_em: date, atualizado_em: date, mensagens: [{ conteudo: '  Quero\n uma diária  amanhã  ' }], _count: { mensagens: 12 } },
        { id_conversa: randomUUID(), criado_em: date, atualizado_em: date, mensagens: [], _count: { mensagens: 1 } },
      ];
    },
    count: async (query) => { counted = query; return 27; },
  } };
  const result = await new ChatbotService({ database }).list({ page: 2, limit: 10 }, auth);
  assert.deepEqual(selected.where, { id_cliente: 3 });
  assert.deepEqual(counted.where, { id_cliente: 3 });
  assert.equal(selected.skip, 10);
  assert.equal(selected.take, 10);
  assert.deepEqual(selected.orderBy, [{ atualizado_em: 'desc' }, { id_conversa: 'desc' }]);
  assert.equal(selected.select.mensagens.where.papel, 'user');
  assert.equal(selected.select.mensagens.take, 1);
  assert.equal(result.data[0].id_conversa, id);
  assert.equal(result.data[0].titulo, 'Quero uma diária amanhã');
  assert.equal(result.data[0].total_mensagens, 12);
  assert.equal(result.data[0].mensagens, undefined);
  assert.equal(result.data[0].estado, undefined);
  assert.equal(result.data[1].titulo, 'Nova conversa');
  assert.deepEqual(result.pagination, { page: 2, limit: 10, total: 27, pages: 3 });
});

test('histórico vazio e títulos extensos têm retorno previsível', async () => {
  let items = [];
  const database = { chatbot_conversa: { findMany: async () => items, count: async () => items.length } };
  const service = new ChatbotService({ database });
  const result = await service.list({ page: 1, limit: 20 }, auth);
  assert.deepEqual(result, { data: [], pagination: { page: 1, limit: 20, total: 0, pages: 0 } });
  items = [{ mensagens: [{ conteudo: 'a'.repeat(2000) }], _count: { mensagens: 2 } }];
  assert.equal((await service.list({ page: 1, limit: 20 }, auth)).data[0].titulo.length, 100);
});

test('listagem exige perfil ativo de cliente antes de consultar o banco', async () => {
  const service = new ChatbotService({ database: { chatbot_conversa: { findMany: () => assert.fail('Não pode consultar dados sem autorização') } } });
  for (const session of [undefined, { id_cliente: 3, activeProfile: 'DIARISTA' }, { activeProfile: 'CLIENTE' }]) {
    await assert.rejects(() => service.list({ page: 1, limit: 20 }, session), (error) => error.statusCode === 403);
  }
});

test('retomar um chat longo recupera também mensagens anteriores à janela de 60', async () => {
  let query;
  const messages = Array.from({ length: 81 }, (_, index) => ({ id_mensagem: String(index), papel: index % 2 ? 'user' : 'assistant', conteudo: `Mensagem ${index}` })).reverse();
  const database = { chatbot_conversa: { findUnique: async (input) => {
    query = input;
    return { id_cliente: 3, estado: {}, propostas: [], mensagens: messages.slice(0, input.include.mensagens.take) };
  } } };
  const result = await new ChatbotService({ database }).get(randomUUID(), auth);
  assert.equal(query.include.mensagens.take, 401);
  assert.equal(result.mensagens.length, 81);
  assert.equal(result.mensagens[0].conteudo, 'Mensagem 0');
  assert.equal(result.mensagens.at(-1).conteudo, 'Mensagem 80');
});

import test from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { createChunks, normalizedDotProduct, RagService } from '../src/services/chatbot/RagService.js';
import { localToday, mergeRequestState, resolveRequestDate } from '../src/services/chatbot/requestState.js';
import { GeminiService } from '../src/services/chatbot/GeminiService.js';
import { ChatbotService } from '../src/services/chatbot/ChatbotService.js';
import { ChatbotBookingService, proposalSignature } from '../src/services/chatbot/ChatbotBookingService.js';
import { DiaristaSearchService } from '../src/services/diarista/DiaristaSearchService.js';
import { chatbotMessageSchema } from '../src/schemas/chatbotSchemas.js';
import { coordinatesFromResponse } from '../src/services/location/CepGeocodingService.js';

const extracted = { data: null, dias_a_partir_de_hoje: null, horario: null, servicos: null, servicos_nao_encontrados: [], limpar_pedido: false };
const auth = { id_usuario: 1, id_cliente: 2, activeProfile: 'CLIENTE' };

test('amanhã respeita São Paulo, inclusive na virada de ano e meia-noite UTC', () => {
  const now = new Date('2027-01-01T01:30:00Z');
  assert.equal(localToday(now), '2026-12-31');
  assert.equal(resolveRequestDate({ ...extracted, dias_a_partir_de_hoje: 1 }, now), '2027-01-01');
  assert.throws(() => resolveRequestDate({ ...extracted, data: '2027-02-30' }, now), /data válida/i);
  assert.throws(() => resolveRequestDate({ ...extracted, data: '2026-12-30' }, now), /data futura/i);
});

test('edição mantém campos não informados e substitui serviços sem manter combo antigo', () => {
  const state = mergeRequestState({ data: '2027-01-01', horario: '07:00', servicos: [1], id_combo_base: 8 }, { ...extracted, horario: '09:00', servicos: [2, 2] });
  assert.deepEqual(state, { data: '2027-01-01', horario: '09:00', servicos: [2] });
  assert.deepEqual(mergeRequestState(state, { ...extracted, limpar_pedido: true }), {});
});

test('chunks preservam fonte, sobreposição e fim do documento', () => {
  const documents = [{ id: 'a', titulo: 'Teste', texto: 'texto '.repeat(160) }];
  const chunks = createChunks(documents);
  assert.ok(chunks.length > 1);
  assert.ok(chunks.every((item) => item.texto.length <= 450 && item.fonte === 'a'));
  assert.equal(chunks[0].texto.slice(-60), chunks[1].texto.slice(0, 60));
  assert.ok(chunks.at(-1).texto.endsWith('texto'));
  assert.throws(() => createChunks(documents, 20, 20));
});

test('recuperação semântica rejeita trechos sem similaridade suficiente', async () => {
  const embedding = { tokenCount: async () => 10, encode: async (texts) => texts.map((text) => text === 'sem relação' ? [0, 1] : [1, 0]) };
  const rag = new RagService(embedding, [{ id: 'aceite', titulo: 'Aceite', texto: 'Depende da diarista.' }]);
  assert.equal((await rag.retrieve('aceite')).length, 1);
  assert.equal((await rag.retrieve('sem relação')).length, 0);
  assert.equal(normalizedDotProduct([1, 0], [0, 1]), 0);
});

test('resposta sem fonte válida não pode afirmar que agendou uma profissional', async () => {
  const client = { models: { generateContent: async () => ({ text: JSON.stringify({ resposta: 'Já agendei!', fontes: ['inventada'] }) }) } };
  const answer = await new GeminiService(client).answer({ mensagem: 'agende', historico: [], contexto: [{ id: 'real', titulo: 'Aceite', texto: 'Pendente' }] });
  assert.deepEqual(answer.fontes, []);
  assert.match(answer.resposta, /Não encontrei/);
});

test('payload do chatbot não aceita identidade, preço ou proposta fornecidos pelo usuário', () => {
  const input = { id_requisicao: randomUUID(), mensagem: 'Quero uma diária' };
  assert.equal(chatbotMessageSchema.safeParse(input).success, true);
  for (const field of ['id_cliente', 'preco', 'payload', 'papel']) assert.equal(chatbotMessageSchema.safeParse({ ...input, [field]: 1 }).success, false);
  assert.equal(chatbotMessageSchema.safeParse({ ...input, selecao: {} }).success, false);
});

test('coordenadas ausentes não são transformadas em localização zero', () => {
  for (const value of [null, undefined, '']) assert.equal(coordinatesFromResponse({ location: { coordinates: { latitude: value, longitude: value } } }), null);
  assert.deepEqual(coordinatesFromResponse({ location: { coordinates: { latitude: '-23.55', longitude: '-46.63' } } }), { latitude: -23.55, longitude: -46.63 });
});

test('conversa de outro cliente não revela dados; perfil de diarista não pode usar chatbot', async () => {
  const database = { chatbot_conversa: { findUnique: async () => ({ id_cliente: 999 }) } };
  const service = new ChatbotService({ database });
  await assert.rejects(() => service.get(randomUUID(), auth), (error) => error.statusCode === 404);
  await assert.rejects(() => service.get(randomUUID(), { id_cliente: 2, activeProfile: 'DIARISTA' }), (error) => error.statusCode === 403);
});

test('busca de contratação exige todos os serviços ativos e exclui o próprio usuário', async () => {
  let where;
  const database = { diarista: { findMany: async (query) => { where = query.where; return []; } } };
  await new DiaristaSearchService(database).bookingCandidates({ date: new Date(), start: new Date(), serviceIds: [3, 7], userId: 12 });
  assert.equal(where.AND.length, 2);
  assert.deepEqual(where.AND[1], { diarista_servico: { some: { id_servico: 7, ativo: true } } });
  assert.deepEqual(where.id_usuario, { not: 12 });
  assert.equal(where.qtd_max_comodos, undefined);
  assert.equal(where.disponibilidade_diarista.some.disponivel, true);
});

test('endereço e serviços ausentes geram perguntas, sem criar agendamento', async () => {
  const database = { cliente: { findUnique: async () => ({ endereco: [] }) } };
  const service = new ChatbotBookingService(database);
  assert.match((await service.propose({}, auth, [])).texto, /endereço/);
  database.cliente.findUnique = async () => ({ endereco: [{ id_endereco: 2 }] });
  assert.match((await service.propose({}, auth, [])).texto, /qual dia/i);
  const outcome = await service.propose({ data: '2027-01-01', horario: '09:00', nao_encontrados: ['banheiro'] }, auth, [{ id_servico: 3, nome_servico: 'Limpar janelas' }]);
  assert.equal(outcome.proposal, undefined);
  assert.equal(outcome.opcoes[0].id, 3);
});

test('assinatura da proposta muda quando preço ou endereço mudar', () => {
  const payload = { id_diarista: 2 };
  assert.notEqual(proposalSignature(payload, { preco: 100 }), proposalSignature(payload, { preco: 101 }));
  assert.notEqual(proposalSignature(payload, { endereco: 'A' }), proposalSignature(payload, { endereco: 'B' }));
  assert.equal(proposalSignature({ a: 1, b: 2 }, {}), proposalSignature({ b: 2, a: 1 }, {}));
});

test('confirmação repetida retorna o mesmo agendamento sem chamar novamente o fluxo de criação', async () => {
  const proposal = { id_proposta: randomUUID(), id_conversa: randomUUID(), status: 'Confirmada', id_agendamento: 77, conversa: { id_cliente: 2 } };
  const database = {
    chatbot_proposta: { findUnique: async () => proposal },
    chatbot_conversa: { findUnique: async () => ({ id_cliente: 2, id_conversa: proposal.id_conversa, estado: {}, mensagens: [], propostas: [proposal] }) },
    $queryRaw: async () => [],
  };
  database.$transaction = async (callback) => callback(database);
  const service = new ChatbotService({ database, booking: { summarize: () => assert.fail('Não deve recalcular uma proposta já confirmada') } });
  assert.equal((await service.confirm(proposal.id_proposta, auth)).id_agendamento, 77);
  assert.equal((await service.confirm(proposal.id_proposta, auth)).id_agendamento, 77);
});

test('dizer confirmar por mensagem apenas orienta o cliente ao botão, sem gravar agendamento', async () => {
  const messages = [];
  const conversation = { id_conversa: randomUUID(), id_cliente: 2, versao: 0, estado: {}, mensagens: [], propostas: [] };
  const database = {
    servico: { findMany: async () => [] },
    chatbot_mensagem: { findUnique: async () => null, create: async ({ data }) => { messages.push(data); } },
    chatbot_conversa: { findUnique: async () => conversation, updateMany: async () => ({ count: 1 }) },
    chatbot_proposta: { create: () => assert.fail('Mensagem não pode criar proposta nesta confirmação') },
    agendamento: { create: () => assert.fail('Mensagem não pode criar agendamento') },
  };
  database.$transaction = async (callback) => callback(database);
  const service = new ChatbotService({ database, gemini: { extract: async () => ({ ...extracted, intencao: 'confirmar' }) } });
  await service.message(conversation.id_conversa, { id_requisicao: randomUUID(), mensagem: 'sim, confirme' }, auth);
  assert.match(messages[1].conteudo, /botão/);
});

test('rejeita escolhas não oferecidas e edição concorrente sem persistir mensagens parciais', async () => {
  const conversation = { id_conversa: randomUUID(), id_cliente: 2, versao: 3, estado: {}, mensagens: [], propostas: [] };
  const database = {
    servico: { findMany: async () => [] },
    chatbot_mensagem: { findUnique: async () => null, create: () => assert.fail('Não deve persistir uma edição rejeitada') },
    chatbot_conversa: { findUnique: async () => conversation, updateMany: async () => ({ count: 0 }) },
  };
  database.$transaction = async (callback) => callback(database);
  const service = new ChatbotService({ database, gemini: { extract: async () => ({ ...extracted, intencao: 'outro' }) } });
  await assert.rejects(() => service.message(conversation.id_conversa, { id_requisicao: randomUUID(), mensagem: 'escolho', selecao: { id_endereco: 100 } }, auth), /opção/);
  await assert.rejects(() => service.message(conversation.id_conversa, { id_requisicao: randomUUID(), mensagem: 'oi' }, auth), (error) => error.statusCode === 409);
});

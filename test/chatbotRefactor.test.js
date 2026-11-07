import test from 'node:test';
import assert from 'node:assert/strict';
import { RagService } from '../src/services/chatbot/RagService.js';
import { ChatbotService } from '../src/services/chatbot/ChatbotService.js';
import { ChatbotBookingService } from '../src/services/chatbot/ChatbotBookingService.js';

test('RAG mantém peso dos exemplos, ordem por similaridade e uma entrada por fonte', async () => {
  const embedding = {
    tokenCount: async () => 10,
    encode: async (texts) => texts.map((text) => {
      if (text === 'consulta' || text === 'exemplo editorial') return [1, 0];
      if (text.startsWith('B:')) return [0.8, 0.6];
      return [0, 1];
    }),
  };
  const rag = new RagService(embedding, [
    { id: 'a', titulo: 'A', texto: 'texto '.repeat(150), perguntas: ['exemplo editorial'] },
    { id: 'b', titulo: 'B', texto: 'Outro conteúdo.' },
    { id: 'c', titulo: 'C', texto: 'Conteúdo sem relação.' },
  ]);
  const result = await rag.retrieve('consulta');
  assert.deepEqual(result.map((chunk) => chunk.fonte), ['a', 'b']);
  assert.deepEqual(result.map((chunk) => chunk.score), [0.9, 0.8]);
  assert.deepEqual(await rag.retrieve('consulta', 0), []);
  assert.equal((await rag.retrieve('consulta', 1)).length, 1);
});

test('RAG compartilha o índice entre chamadas e permite nova tentativa após falha', async () => {
  let attempts = 0;
  const embedding = {
    tokenCount: async () => 10,
    encode: async (texts) => {
      attempts++;
      if (attempts === 1) throw new Error('Falha temporária');
      return texts.map(() => [1, 0]);
    },
  };
  const rag = new RagService(embedding, [{ id: 'a', titulo: 'A', texto: 'Conteúdo.' }]);
  await assert.rejects(rag.prepare(), /Falha temporária/);
  const [first, second] = await Promise.all([rag.prepare(), rag.prepare()]);
  assert.strictEqual(first, second);
  assert.strictEqual(await rag.prepare(), first);
  assert.equal(attempts, 2);
});

test('RAG reduz os chunks até respeitar o limite do tokenizer sem perder o final', async () => {
  const embedding = {
    tokenCount: async (text) => Math.ceil(text.length / 2),
    encode: async (texts) => texts.map(() => [1, 0]),
  };
  const rag = new RagService(embedding, [{ id: 'a', titulo: 'A', texto: 'texto '.repeat(150) }]);
  const { chunks } = await rag.prepare();
  assert.ok(chunks.length > 1);
  assert.ok(chunks.every((chunk) => chunk.texto.length <= 256));
  assert.ok(chunks.at(-1).texto.endsWith('texto'));
});

test('referência nula de diarista não reutiliza a profissional de uma proposta anterior', async () => {
  const state = { diarista_consultada: null };
  const service = new ChatbotService({
    database: {},
    catalog: {
      answer: async (query, reference) => {
        assert.equal(reference, null);
        return { texto: 'Informe o nome.', fontes: [], diarista_consultada: null };
      },
    },
  });
  const result = await service.answerQuestion({
    conversation: { propostas: [{ resumo: { diarista: { id_diarista: 99 } } }] },
    extraction: { consulta_diarista: { nome: null, assunto: 'combos' } },
    state,
  });
  assert.equal(result.texto, 'Informe o nome.');
  assert.equal(state.diarista_consultada, null);
});

test('dúvida sem contexto não chama a geração de resposta', async () => {
  const service = new ChatbotService({
    database: {},
    rag: { retrieve: async () => [] },
    gemini: { answer: () => assert.fail('Não deve gerar uma resposta sem contexto') },
  });
  const result = await service.answerQuestion({
    conversation: {}, input: { mensagem: 'Pergunta desconhecida' },
    history: [], extraction: {}, state: { opcoes: [] },
  });
  assert.match(result.texto, /Não encontrei essa informação/);
  assert.deepEqual(result.fontes, []);
});

test('ordenação por distância mantém desempate por ID e CEP desconhecido por último', async () => {
  const geocode = async (cep) => cep === 'conhecido' ? { latitude: -23, longitude: -46 } : null;
  const booking = new ChatbotBookingService({}, geocode);
  const profiles = [
    { id_diarista: 3, endereco: [{ cep: 'desconhecido' }] },
    { id_diarista: 2, endereco: [{ cep: 'conhecido' }] },
    { id_diarista: 1, endereco: [{ cep: 'conhecido' }] },
    { id_diarista: 4, endereco: [] },
  ];
  const ranked = await booking.rankByDistance(profiles, { latitude: -23, longitude: -46 });
  assert.deepEqual(ranked.map(({ profile }) => profile.id_diarista), [1, 2, 3, 4]);
  assert.deepEqual(ranked.map(({ distance }) => distance), [0, 0, null, null]);
});

import test from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { ChatbotCatalogService } from '../src/services/chatbot/ChatbotCatalogService.js';
import { ChatbotService } from '../src/services/chatbot/ChatbotService.js';
import { extractionSchema } from '../src/schemas/chatbotSchemas.js';

const professional = () => ({
  id_diarista: 18, usuario: { nome: 'Rafael Sá' }, descricao: 'Limpeza residencial.', avaliacao_media: '4.5',
  endereco: [{ cidade: 'São Paulo', estado: 'SP' }],
  diarista_servico: [{ id_servico: 3, preco: '90.00', servico: { nome_servico: 'Passar pano', descricao: 'Limpeza dos pisos.' } }],
  combo_base: [{ nome_combo: 'Faxina completa', descricao: 'Limpeza da residência.', valor_base: '250.00', atende_casa_pequena: true, atende_casa_media: true, atende_casa_grande: false, combo_servico: [{ id_servico: 3, servico: { nome_servico: 'Passar pano' } }] }],
});

function catalogWith(results) {
  const queries = [];
  const database = { diarista: { findMany: async (query) => { queries.push(query); return typeof results === 'function' ? results(query) : results; } } };
  return { catalog: new ChatbotCatalogService(database), queries };
}

test('consulta combos e preços atuais por nome, sem consultar ou expor dados privados', async () => {
  const { catalog, queries } = catalogWith([professional()]);
  const answer = await catalog.answer({ nome: 'Rafael Sá', assunto: 'combos' });
  assert.match(answer.texto, /Combos ativos de Rafael Sá/);
  assert.match(answer.texto, /Faxina completa — R\$\s250,00/);
  assert.match(answer.texto, /Serviços incluídos: Passar pano/);
  assert.match(answer.texto, /Pequena, Média/);
  assert.match(answer.texto, /disponibilidade.*separadamente/);
  assert.equal(answer.diarista_consultada, 18);
  assert.equal(answer.fontes[0].id, 'diarista:18:combos');
  assert.equal(queries.length, 1);
  const [query] = queries;
  assert.deepEqual(query.where.usuario, { ativo: true, bloqueado: false, nome: { equals: 'Rafael Sá' } });
  assert.deepEqual(query.select.usuario, { select: { nome: true } });
  assert.deepEqual(query.select.endereco, { select: { cidade: true, estado: true } });
  assert.deepEqual(query.select.combo_base.where, { ativo: true });
  assert.deepEqual(query.select.diarista_servico.where, { ativo: true });
  assert.equal(query.select.agendamento, undefined);
  assert.equal(query.select.cliente, undefined);
});

test('uma consulta posterior relê os valores no banco, sem cache de preços', async () => {
  const profile = professional();
  const { catalog } = catalogWith([profile]);
  assert.match((await catalog.answer({ nome: 'Rafael Sá', assunto: 'combos' })).texto, /250,00/);
  profile.combo_base[0].valor_base = '310.00';
  const next = await catalog.answer({ nome: null, assunto: 'combos' }, 18);
  assert.match(next.texto, /310,00/);
  assert.doesNotMatch(next.texto, /250,00/);
});

test('sem combos cadastrados informa ausência real, em vez de falha da base editorial', async () => {
  const profile = { ...professional(), combo_base: [] };
  const { catalog } = catalogWith([profile]);
  const answer = await catalog.answer({ nome: 'Rafael Sá', assunto: 'combos' });
  assert.match(answer.texto, /Rafael Sá não possui combos ativos/);
  assert.doesNotMatch(answer.texto, /base de conhecimento/);
});

test('resolve referência da conversa por ID e também consulta serviços individuais', async () => {
  const { catalog, queries } = catalogWith([professional()]);
  const answer = await catalog.answer({ nome: null, assunto: 'servicos' }, 18);
  assert.equal(queries[0].where.id_diarista, 18);
  assert.match(answer.texto, /Passar pano — R\$\s90,00/);
  assert.match(answer.texto, /Limpeza dos pisos/);
  assert.doesNotMatch(answer.texto, /Faxina completa/);
});

test('nome desconhecido não reutiliza silenciosamente a diarista anterior', async () => {
  const { catalog, queries } = catalogWith([]);
  const answer = await catalog.answer({ nome: 'Pessoa inexistente', assunto: 'combos' }, 18);
  assert.match(answer.texto, /Não encontrei uma diarista ativa/);
  assert.equal(answer.diarista_consultada, null);
  assert.equal(queries.length, 2);
  assert.equal(queries[1].where.usuario.nome.contains, 'Pessoa inexistente');
  assert.ok(queries.every((query) => query.where.id_diarista === undefined));
});

test('pede identificação ou desambiguação sem atribuir combos a uma pessoa arbitrária', async () => {
  const { catalog, queries } = catalogWith([professional(), { ...professional(), id_diarista: 19, usuario: { nome: 'Rafael Santos' } }]);
  assert.match((await catalog.answer({ nome: null, assunto: 'combos' })).texto, /Informe o nome completo/);
  assert.equal(queries.length, 0);
  const answer = await catalog.answer({ nome: 'Rafael', assunto: 'combos' });
  assert.match(answer.texto, /mais de uma diarista/);
  assert.equal(answer.diarista_consultada, null);
  assert.doesNotMatch(answer.texto, /Faxina completa/);
});

test('combo com serviço desativado não é apresentado como contratação garantida', async () => {
  const profile = { ...professional(), diarista_servico: [] };
  const { catalog } = catalogWith([profile]);
  const answer = await catalog.answer({ nome: 'Rafael Sá', assunto: 'combos' });
  assert.match(answer.texto, /serviço que não está ativo/);
  assert.equal(answer.proposal, undefined);
  assert.equal(answer.opcoes, undefined);
});

test('consulta estruturada aceita nome e assunto, mas não IDs ou comandos de acesso', () => {
  const extraction = { intencao: 'duvida', data: null, dias_a_partir_de_hoje: null, horario: null, servicos: null, servicos_nao_encontrados: [], limpar_pedido: false, pergunta_contextualizada: null, esclarecimento: null, consulta_diarista: { nome: 'Rafael Sá', assunto: 'combos' } };
  assert.equal(extractionSchema.safeParse(extraction).success, true);
  assert.equal(extractionSchema.safeParse({ ...extraction, consulta_diarista: { ...extraction.consulta_diarista, id_diarista: 18 } }).success, false);
  assert.equal(extractionSchema.safeParse({ ...extraction, consulta_diarista: { nome: 'Rafael Sá', assunto: 'senha' } }).success, false);
});

test('dúvidas sobre uma diarista consultam o banco, mantêm o pedido e contextualizam a próxima pergunta', async () => {
  const conversation = { id_conversa: randomUUID(), id_cliente: 2, versao: 0, estado: { horario: '09:00', servicos: [3], opcoes: [{ tipo: 'combo', id: 4, label: 'Combo da proposta' }] }, mensagens: [], propostas: [{ status: 'Pendente', resumo: { diarista: { id_diarista: 99 } } }] };
  let consulta = { nome: 'Rafael Sá', assunto: 'combos' };
  const queries = [];
  const database = {
    diarista: { findMany: async (query) => { queries.push(query); return [professional()]; } },
    servico: { findMany: async () => [] },
    chatbot_mensagem: { findUnique: async () => null, create: async ({ data }) => { conversation.mensagens.unshift(data); } },
    chatbot_conversa: {
      findUnique: async () => conversation,
      updateMany: async ({ data }) => { conversation.estado = data.estado; conversation.versao++; return { count: 1 }; },
    },
    chatbot_proposta: { updateMany: () => assert.fail('Consulta não pode invalidar a proposta'), create: () => assert.fail('Consulta não pode criar proposta') },
    agendamento: { create: () => assert.fail('Consulta não pode agendar') },
  };
  database.$transaction = async (callback) => callback(database);
  const chatbot = new ChatbotService({ database, gemini: { extract: async () => ({ intencao: 'duvida', consulta_diarista: consulta }) }, rag: { retrieve: () => assert.fail('Catálogo real não é consultado no RAG editorial') }, booking: { propose: () => assert.fail('Consulta não é pedido de contratação') } });
  const auth = { id_usuario: 1, id_cliente: 2, activeProfile: 'CLIENTE' };
  const ask = (mensagem) => chatbot.message(conversation.id_conversa, { id_requisicao: randomUUID(), mensagem }, auth);
  const first = await ask('a diarista Rafael Sá tem combos?');
  assert.match(first.mensagens.at(-1).conteudo, /Faxina completa/);
  assert.equal(conversation.estado.diarista_consultada, 18);
  assert.equal(conversation.estado.horario, '09:00');
  assert.deepEqual(conversation.estado.servicos, [3]);
  assert.equal(first.proposta.status, 'Pendente');
  assert.equal(first.opcoes[0].id, 4);
  consulta = { nome: null, assunto: 'servicos' };
  const second = await ask('e quais serviços ela oferece?');
  assert.equal(queries.at(-1).where.id_diarista, 18);
  assert.match(second.mensagens.at(-1).conteudo, /Passar pano/);
});

test('dúvida geral continua usando o RAG, sem consultar um catálogo arbitrário', async () => {
  const conversation = { id_conversa: randomUUID(), id_cliente: 2, versao: 0, estado: {}, mensagens: [], propostas: [] };
  const messages = [];
  const database = {
    servico: { findMany: async () => [] },
    chatbot_mensagem: { findUnique: async () => null, create: async ({ data }) => { messages.push(data); } },
    chatbot_conversa: { findUnique: async () => conversation, updateMany: async () => ({ count: 1 }) },
  };
  database.$transaction = async (callback) => callback(database);
  const chatbot = new ChatbotService({
    database, catalog: { answer: () => assert.fail('Dúvida editorial não é catálogo de uma pessoa') },
    rag: { retrieve: async () => [{ id: 'combo:0', texto: 'Serviços agrupados.' }] },
    gemini: { extract: async () => ({ intencao: 'duvida', consulta_diarista: null }), answer: async () => ({ resposta: 'Um combo reúne serviços.', fontes: [{ id: 'combo:0', titulo: 'Combos' }] }) },
  });
  await chatbot.message(conversation.id_conversa, { id_requisicao: randomUUID(), mensagem: 'Como funciona um combo?' }, { id_cliente: 2, activeProfile: 'CLIENTE' });
  assert.equal(messages[1].conteudo, 'Um combo reúne serviços.');
});

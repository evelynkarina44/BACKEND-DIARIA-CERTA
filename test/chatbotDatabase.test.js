import 'dotenv/config';
import test from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import prisma from '../src/lib/prisma.js';
import { ChatbotService } from '../src/services/chatbot/ChatbotService.js';
import { ChatbotBookingService } from '../src/services/chatbot/ChatbotBookingService.js';
import { AgendamentoWorkflowService } from '../src/services/agendamento/AgendamentoWorkflowService.js';
import { DiaristaSearchService } from '../src/services/diarista/DiaristaSearchService.js';
import { createAgendamentoSchema } from '../src/schemas/apiSchemas.js';

test('MySQL real: proposta, confirmação idempotente, alteração, expiração e conflitos; fixtures sempre revertidas', {
  skip: process.env.RUN_CHATBOT_DATABASE_TESTS !== '1', timeout: 60000,
}, async () => {
  const rollback = new Error('ROLLBACK_CHATBOT_TEST');
  try {
    await assert.rejects(() => prisma.$transaction(async (tx) => {
      const suffix = randomUUID();
      const user = (nome) => tx.usuario.create({ data: { nome, email: `${nome}-${suffix}@example.invalid`, telefone: '11999999999', senha: 'fixture-nao-utilizavel-para-login' } });
      const customerUser = await user('ClienteChatbot');
      const professionalUser = await user('DiaristaChatbot');
      const address = { logradouro: 'Rua de teste', numero: 10, bairro: 'Centro', cidade: 'São Paulo', estado: 'SP', cep: '01001-000' };
      const customer = await tx.cliente.create({ data: { id_usuario: customerUser.id_usuario, data_nascimento: new Date('1990-01-01'), qtd_comodos: 3, tamanho_casa: 'pequena', endereco: { create: address } } });
      // O cliente tem 3 cômodos; o limite cadastrado de 1 não deve impedir a contratação.
      const professional = await tx.diarista.create({ data: { id_usuario: professionalUser.id_usuario, descricao: 'Profissional usada apenas no teste revertido.', qtd_max_comodos: 1, endereco: { create: address } } });
      const service = await tx.servico.create({ data: { nome_servico: `Teste chatbot ${suffix}` } });
      const offered = await tx.diarista_servico.create({ data: { id_diarista: professional.id_diarista, id_servico: service.id_servico, preco: 100 } });
      const day = new Date(); day.setUTCDate(day.getUTCDate() + 7); day.setUTCHours(0, 0, 0, 0);
      const date = day.toISOString().slice(0, 10);
      await tx.disponibilidade_diarista.create({ data: { id_diarista: professional.id_diarista, dia_semana: day, horario_inicio: new Date('1970-01-01T09:00:00Z'), horario_fim: new Date('1970-01-01T10:00:00Z'), disponivel: true } });
      const auth = { id_usuario: customerUser.id_usuario, id_cliente: customer.id_cliente, activeProfile: 'CLIENTE' };
      const database = new Proxy(tx, { get(target, property) { return property === '$transaction' ? async (callback) => callback(target) : Reflect.get(target, property); } });
      const gemini = { extract: async () => ({ intencao: 'buscar', data: date, dias_a_partir_de_hoje: null, horario: '09:00', servicos: [service.id_servico], servicos_nao_encontrados: [], limpar_pedido: false }) };
      const booking = new ChatbotBookingService(database, async () => ({ latitude: -23.55, longitude: -46.63 }));
      const candidates = await new DiaristaSearchService(database).bookingCandidates({ date: day, start: new Date('1970-01-01T09:00:00Z'), serviceIds: [service.id_servico], userId: customerUser.id_usuario });
      assert.equal(candidates.length, 1);
      const customerAddress = (await booking.client(auth)).endereco[0];
      await assert.doesNotReject(() => booking.summarize({ id_diarista: professional.id_diarista, id_endereco: customerAddress.id_endereco, data_agendamento: date, horario_inicio: '09:00', horario_fim: '10:00', qtd_comodos: 3, tamanho_residencia: 'pequena', servicos: [{ id_diarista_servico: offered.id_diarista_servico }] }, auth));
      const chatbot = new ChatbotService({ database, gemini, booking });
      const start = () => chatbot.create({ nova: true }, auth);
      const ask = (id) => chatbot.message(id, { id_requisicao: randomUUID(), mensagem: 'Preciso de uma diária.' }, auth);
      const conversation = await start();
      const input = { id_requisicao: randomUUID(), mensagem: 'Na próxima semana às 09:00.' };
      const quoted = await chatbot.message(conversation.id_conversa, input, auth);
      assert.ok(quoted.proposta, JSON.stringify(quoted));
      assert.equal(quoted.proposta.resumo.valor_estimado, 100);
      assert.equal(quoted.proposta.resumo.diarista.id_diarista, professional.id_diarista);
      assert.equal(quoted.proposta.resumo.distancia_km, 0);
      assert.equal(quoted.mensagens.at(-1).papel, 'assistant');
      assert.equal(new Date(quoted.proposta.criado_em).getTime(), new Date(quoted.mensagens.at(-1).criado_em).getTime());
      const retried = await chatbot.message(conversation.id_conversa, input, auth);
      assert.equal(retried.mensagens.length, quoted.mensagens.length);
      await assert.rejects(() => chatbot.get(conversation.id_conversa, { ...auth, id_cliente: customer.id_cliente + 999999 }), (error) => error.statusCode === 404);
      const confirmed = await chatbot.confirm(quoted.proposta.id_proposta, auth);
      const repeated = await chatbot.confirm(quoted.proposta.id_proposta, auth);
      assert.equal(repeated.id_agendamento, confirmed.id_agendamento);
      assert.equal(new Date(confirmed.conversa.proposta.criado_em).getTime(), new Date(quoted.proposta.criado_em).getTime());
      const appointment = await tx.agendamento.findUnique({ where: { id_agendamento: confirmed.id_agendamento } });
      assert.equal(appointment.status, 'Pendente');
      assert.equal(appointment.qtd_comodos, 3);
      assert.equal(await tx.agendamento.count({ where: { id_cliente: customer.id_cliente } }), 1);

      const extra = await tx.servico.create({ data: { nome_servico: `Extra chatbot ${suffix}` } });
      await tx.diarista_servico.create({ data: { id_diarista: professional.id_diarista, id_servico: extra.id_servico, preco: 40 } });
      const combo = await tx.combo_base.create({ data: { id_diarista: professional.id_diarista, nome_combo: 'Combo de teste', valor_base: 80, qtd_comodos_casa: 1, atende_casa_pequena: true, combo_servico: { create: { id_servico: service.id_servico } } } });
      const originalExtract = gemini.extract;
      gemini.extract = async () => ({ intencao: 'duvida', consulta_diarista: { nome: professionalUser.nome, assunto: 'combos' } });
      const catalogAnswer = await chatbot.message(conversation.id_conversa, { id_requisicao: randomUUID(), mensagem: `A diarista ${professionalUser.nome} tem combos?` }, auth);
      assert.match(catalogAnswer.mensagens.at(-1).conteudo, /Combo de teste — R\$\s80,00/);
      assert.ok(catalogAnswer.mensagens.at(-1).conteudo.includes(service.nome_servico));
      assert.equal(catalogAnswer.mensagens.at(-1).fontes[0].id, `diarista:${professional.id_diarista}:combos`);
      assert.equal(new Date(catalogAnswer.proposta.criado_em).getTime(), new Date(quoted.proposta.criado_em).getTime());
      assert.ok(new Date(catalogAnswer.mensagens.at(-1).criado_em) > new Date(catalogAnswer.proposta.criado_em));
      gemini.extract = async () => ({ intencao: 'duvida', consulta_diarista: { nome: null, assunto: 'servicos' } });
      const followUp = await chatbot.message(conversation.id_conversa, { id_requisicao: randomUUID(), mensagem: 'E os serviços dela?' }, auth);
      assert.ok(followUp.mensagens.at(-1).conteudo.includes(extra.nome_servico));
      assert.match(followUp.mensagens.at(-1).conteudo, /R\$\s40,00/);
      assert.equal(await tx.agendamento.count({ where: { id_cliente: customer.id_cliente } }), 1);
      gemini.extract = async () => ({ ...await originalExtract(), servicos: [service.id_servico, extra.id_servico] });

      // Histórico: paginação, privacidade e retomada sem renovar a proposta confirmada.
      const otherUser = await user('OutroClienteChatbot');
      const otherCustomer = await tx.cliente.create({ data: { id_usuario: otherUser.id_usuario, data_nascimento: new Date('1990-01-01'), qtd_comodos: 2 } });
      const otherAuth = { id_usuario: otherUser.id_usuario, id_cliente: otherCustomer.id_cliente, activeProfile: 'CLIENTE' };
      const otherChat = await chatbot.create({ nova: true }, otherAuth);
      const history = await chatbot.list({ page: 1, limit: 20 }, auth);
      assert.equal(history.pagination.total, 1);
      assert.equal(history.data[0].id_conversa, conversation.id_conversa);
      assert.equal(history.data[0].titulo, input.mensagem);
      assert.ok(history.data.every((item) => item.id_conversa !== otherChat.id_conversa));
      await assert.rejects(() => chatbot.get(conversation.id_conversa, otherAuth), (error) => error.statusCode === 404);
      const emptyChat = await start();
      const firstPage = await chatbot.list({ page: 1, limit: 1 }, auth);
      const secondPage = await chatbot.list({ page: 2, limit: 1 }, auth);
      assert.equal(firstPage.pagination.pages, 2);
      assert.equal(new Set([...firstPage.data, ...secondPage.data].map((item) => item.id_conversa)).size, 2);
      assert.equal([...firstPage.data, ...secondPage.data].find((item) => item.id_conversa === emptyChat.id_conversa).titulo, 'Nova conversa');
      const resumed = await chatbot.get(conversation.id_conversa, auth);
      assert.equal(resumed.proposta.status, 'Confirmada');
      assert.equal(resumed.proposta.id_agendamento, confirmed.id_agendamento);
      assert.equal(new Date(resumed.proposta.criado_em).getTime(), new Date(quoted.proposta.criado_em).getTime());
      const messageStart = Date.now();
      await tx.chatbot_mensagem.createMany({ data: Array.from({ length: 80 }, (_, index) => ({ id_conversa: emptyChat.id_conversa, papel: index % 2 ? 'assistant' : 'user', conteudo: `Mensagem do histórico ${index}`, criado_em: new Date(messageStart + index + 1) })) });
      await tx.chatbot_conversa.update({ where: { id_conversa: emptyChat.id_conversa }, data: { versao: 40 } });
      assert.equal((await chatbot.get(emptyChat.id_conversa, auth)).mensagens.length, 81);

      const individualExtras = await ask((await start()).id_conversa);
      assert.equal(individualExtras.proposta.resumo.valor_estimado, 140);
      assert.ok(individualExtras.opcoes.some((option) => option.tipo === 'combo' && option.id === combo.id_combo_base));
      const combined = await chatbot.message(individualExtras.id_conversa, { id_requisicao: randomUUID(), mensagem: 'Escolher combo de teste', selecao: { id_combo_base: combo.id_combo_base } }, auth);
      assert.equal(combined.proposta.resumo.valor_estimado, 120);
      assert.equal(combined.proposta.resumo.servicos.length, 2);
      assert.equal(combined.proposta.resumo.combo, 'Combo de teste');
      await chatbot.cancel(combined.proposta.id_proposta, auth);
      gemini.extract = originalExtract;

      const changed = await ask((await start()).id_conversa);
      await tx.diarista_servico.update({ where: { id_diarista_servico: offered.id_diarista_servico }, data: { preco: 150 } });
      await assert.rejects(() => chatbot.confirm(changed.proposta.id_proposta, auth), /mudaram/);
      assert.equal((await tx.chatbot_proposta.findUnique({ where: { id_proposta: changed.proposta.id_proposta } })).status, 'Substituida');
      assert.equal(await tx.agendamento.count({ where: { id_cliente: customer.id_cliente } }), 1);

      const expired = await ask((await start()).id_conversa);
      await tx.chatbot_proposta.update({ where: { id_proposta: expired.proposta.id_proposta }, data: { expira_em: new Date(0) } });
      await assert.rejects(() => chatbot.confirm(expired.proposta.id_proposta, auth), /não está mais disponível/);
      const cancelled = await ask((await start()).id_conversa);
      assert.equal((await chatbot.cancel(cancelled.proposta.id_proposta, auth)).proposta.status, 'Cancelada');
      assert.equal((await chatbot.cancel(cancelled.proposta.id_proposta, auth)).proposta.status, 'Cancelada');

      // O aceite real passa pelas travas e pela política compartilhada de conflitos.
      const professionalAuth = { id_usuario: professionalUser.id_usuario, id_diarista: professional.id_diarista, activeProfile: 'DIARISTA' };
      const workflow = new AgendamentoWorkflowService(database);
      const repeatedPending = await workflow.create(createAgendamentoSchema.parse((await tx.chatbot_proposta.findUnique({ where: { id_proposta: quoted.proposta.id_proposta } })).payload), auth, true);
      await workflow.accept(appointment.id_agendamento, professionalAuth);
      await assert.rejects(() => workflow.accept(repeatedPending.id_agendamento, professionalAuth), /agendamento aceito/);
      const unavailable = await ask((await start()).id_conversa);
      assert.equal(unavailable.proposta, null);
      assert.match(unavailable.mensagens.at(-1).conteudo, /Não encontrei/);

      // Reprodução do relato: somente o próprio perfil tem a agenda cadastrada.
      const ownProfile = await tx.diarista.create({ data: { id_usuario: customerUser.id_usuario, descricao: 'Perfil duplo usado apenas no teste revertido.', qtd_max_comodos: 5 } });
      await tx.diarista_servico.create({ data: { id_diarista: ownProfile.id_diarista, id_servico: service.id_servico, preco: 100 } });
      await tx.disponibilidade_diarista.create({ data: { id_diarista: ownProfile.id_diarista, dia_semana: day, horario_inicio: new Date('1970-01-01T09:00:00Z'), horario_fim: new Date('1970-01-01T10:00:00Z'), disponivel: true } });
      await tx.disponibilidade_diarista.deleteMany({ where: { id_diarista: professional.id_diarista } });
      const onlySelf = await ask((await start()).id_conversa);
      assert.equal(onlySelf.proposta, null);
      assert.match(onlySelf.mensagens.at(-1).conteudo, /horários futuros cadastrados/);
      assert.match(onlySelf.mensagens.at(-1).conteudo, /não é permitido contratar a mesma conta/);
      throw rollback;
    }, { timeout: 45000, isolationLevel: 'ReadCommitted' }), (error) => error === rollback);
  } finally {
    await prisma.$disconnect();
  }
});

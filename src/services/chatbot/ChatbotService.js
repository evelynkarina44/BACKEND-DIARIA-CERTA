// POLLYANA | ETAPAS 1 E 2 — Coordenador: interpretação não é execução livre.
// Mostrar message() e seus três caminhos; depois confirm() para a ação explícita do cliente.
import prisma from '../../lib/prisma.js';
import { ChatbotRepository } from '../../repositories/chatbotRepository.js';
import { BadRequestError, ConflictError, ForbiddenError, NotFoundError } from '../../errors/index.js';
import { ChatbotBookingService } from './ChatbotBookingService.js';
import { ChatbotCatalogService } from './ChatbotCatalogService.js';
import { GeminiService } from './GeminiService.js';
import { ragService } from './RagService.js';
import { localToday, mergeRequestState } from './requestState.js';
import { AgendamentoWorkflowService } from '../agendamento/AgendamentoWorkflowService.js';
import { lockDiarista } from '../agendamento/availabilityPolicy.js';
import { createAgendamentoSchema } from '../../schemas/apiSchemas.js';

const welcome = 'Olá! Sou o assistente do Diária Certa. Posso ajudar a encontrar uma diarista ou explicar como a plataforma funciona. Para agendar, conte o dia, o horário de início e os serviços desejados.';
const emptyExtraction = { intencao: 'buscar', data: null, dias_a_partir_de_hoje: null, horario: null, servicos: null, servicos_nao_encontrados: [], limpar_pedido: false };

function publicConversation(conversation) {
  const proposal = conversation.propostas?.[0];
  return {
    id_conversa: conversation.id_conversa,
    versao: conversation.versao,
    mensagens: [...(conversation.mensagens || [])].reverse().map(({ id_mensagem, papel, conteudo, criado_em, fontes }) => ({ id_mensagem, papel, conteudo, criado_em, fontes })),
    proposta: proposal ? {
      id_proposta: proposal.id_proposta,
      status: proposal.status === 'Pendente' && new Date(proposal.expira_em) <= new Date() ? 'Expirada' : proposal.status,
      resumo: proposal.resumo, criado_em: proposal.criado_em, expira_em: proposal.expira_em, id_agendamento: proposal.id_agendamento,
    } : null,
    opcoes: conversation.estado?.opcoes || [],
  };
}

export class ChatbotService {
  constructor({ database = prisma, gemini = new GeminiService(), rag = ragService, booking, catalog } = {}) {
    this.database = database;
    this.repository = new ChatbotRepository(database);
    this.gemini = gemini;
    this.rag = rag;
    this.booking = booking || new ChatbotBookingService(database);
    this.catalog = catalog || new ChatbotCatalogService(database);
  }

  requireClient(auth) {
    if (!auth?.id_cliente || auth.activeProfile !== 'CLIENTE') throw new ForbiddenError('Ative seu perfil de cliente para utilizar o assistente.');
  }

  async ownedConversation(id, auth) {
    this.requireClient(auth);
    const conversation = await this.repository.find(id);
    if (!conversation || conversation.id_cliente !== auth.id_cliente) throw new NotFoundError('Conversa não encontrada');
    return conversation;
  }

  async create({ nova = false }, auth) {
    this.requireClient(auth);
    const latest = !nova && await this.repository.latest(auth.id_cliente);
    if (latest) return this.get(latest.id_conversa, auth);
    const conversation = await this.database.chatbot_conversa.create({
      data: { id_cliente: auth.id_cliente, estado: {}, mensagens: { create: { papel: 'assistant', conteudo: welcome } } },
    });
    return this.get(conversation.id_conversa, auth);
  }

  async get(id, auth) { return publicConversation(await this.ownedConversation(id, auth)); }

  async list(query, auth) {
    this.requireClient(auth);
    const result = await this.repository.list(auth.id_cliente, query);
    return {
      ...result,
      data: result.data.map((conversation) => ({
        id_conversa: conversation.id_conversa,
        titulo: conversation.mensagens[0]?.conteudo.replace(/\s+/g, ' ').trim().slice(0, 100) || 'Nova conversa',
        criado_em: conversation.criado_em, atualizado_em: conversation.atualizado_em,
        total_mensagens: conversation._count.mensagens,
      })),
    };
  }

  // POLLYANA | ETAPA 1 — Início da mensagem: conversa pertence ao cliente?
  // Aqui também evitamos reprocessar a mesma requisição e consultamos o catálogo atual.
  async message(id, input, auth) {
    const conversation = await this.ownedConversation(id, auth);
    const repeated = await this.database.chatbot_mensagem.findUnique({ where: { id_conversa_id_requisicao: { id_conversa: id, id_requisicao: input.id_requisicao } } });
    if (repeated) return publicConversation(conversation);
    if (conversation.versao >= 200) throw new BadRequestError('Esta conversa atingiu o limite de mensagens. Inicie uma nova conversa.');
    const catalog = await this.database.servico.findMany({
      where: { diarista_servico: { some: { ativo: true, diarista: { usuario: { ativo: true, bloqueado: false } } } } },
      select: { id_servico: true, nome_servico: true, descricao: true }, orderBy: { nome_servico: 'asc' },
    });
    // APOIO | PESSOA 3 | ETAPA 3 — Até 6 mensagens recentes + estado estruturado; não é treinamento.
    const history = [...conversation.mensagens].reverse().slice(-6).map((item) => ({ role: item.papel, content: item.conteudo.slice(0, 1000) }));
    const { opcoes: _options, ...previous } = conversation.estado;
    // A IA já interpreta a mensagem antes do RAG; a resposta documental final será gerada depois.
    const extraction = input.selecao ? { ...emptyExtraction } : await this.gemini.extract({
      mensagem: input.mensagem, historico: history, estado: previous,
      catalogo: catalog.map((item) => ({ ...item, descricao: item.descricao?.slice(0, 300) })), hoje: localToday(),
    });
    if (input.selecao) {
      const requested = input.selecao;
      for (const [field, type] of [['id_servico', 'servico'], ['id_endereco', 'endereco'], ['id_combo_base', 'combo']]) {
        if (field in requested && !conversation.estado.opcoes?.some((option) => option.tipo === type && option.id === requested[field])) {
          throw new BadRequestError('Essa opção não está disponível nesta conversa. Atualize a tela.');
        }
      }
    }
    let state = mergeRequestState(previous, extraction, input.selecao);
    let outcome;
    let invalidate = false;
    // POLLYANA | ETAPA 2 — Destacar os caminhos de dúvida, cadastro e proposta.
    if (extraction.esclarecimento && ['buscar', 'alterar'].includes(extraction.intencao)) {
      invalidate = true;
      outcome = { texto: extraction.esclarecimento, opcoes: [] };
    } else if (extraction.intencao === 'duvida') {
      state = { ...conversation.estado };
      if (extraction.consulta_diarista) {
        // CAMINHO: profissional específica -> cadastro atual, não RAG. Continuar em ChatbotCatalogService.
        const reference = 'diarista_consultada' in state ? state.diarista_consultada : conversation.propostas?.[0]?.resumo?.diarista?.id_diarista;
        const answer = await this.catalog.answer(extraction.consulta_diarista, reference);
        state.diarista_consultada = answer.diarista_consultada;
        outcome = { texto: answer.texto, fontes: answer.fontes, opcoes: state.opcoes || [] };
      } else {
        // EVELYN | ETAPA 7 — Retrieval: obter contexto para uma dúvida geral.
        const query = extraction.pergunta_contextualizada || input.mensagem;
        const context = await this.rag.retrieve(query);
        // EVELYN | ETAPA 8 — Generation apenas com contexto; ver GeminiService.answer().
        const answer = context.length ? await this.gemini.answer({ mensagem: input.mensagem, historico: history, contexto: context }) : { resposta: 'Não encontrei essa informação na base de conhecimento do Diária Certa.', fontes: [] };
        outcome = { texto: answer.resposta, fontes: answer.fontes, opcoes: state.opcoes || [] };
      }
    } else if (extraction.intencao === 'cancelar') {
      state = {};
      invalidate = true;
      outcome = { texto: 'Encerrei este pedido no assistente. Isso não cancela agendamentos já enviados; você pode consultá-los no Histórico.', opcoes: [] };
    } else if (extraction.intencao === 'confirmar') {
      // POLLYANA | ETAPA 6 — Escrever "confirme" só orienta; não cria agendamento.
      state = { ...conversation.estado };
      outcome = { texto: 'Revise o card da proposta e toque em Confirmar solicitação para enviar o pedido. Somente esse botão envia a solicitação.', opcoes: state.opcoes || [] };
    } else if (extraction.intencao === 'outro' && !input.selecao) {
      state = { ...conversation.estado };
      outcome = { texto: 'Posso ajudar com uma diária ou com dúvidas sobre a plataforma. Diga o dia, o horário e os serviços, ou faça sua pergunta.', opcoes: state.opcoes || [] };
    } else {
      // CAMINHO: pedido de diária -> validação e proposta. Continuar em ChatbotBookingService.propose().
      outcome = await this.booking.propose(state, auth, catalog);
      if (outcome.proposal) state.diarista_consultada = outcome.proposal.resumo.diarista.id_diarista;
      invalidate = true;
    }
    state.opcoes = outcome.opcoes || [];
    await this.database.$transaction(async (tx) => {
      const changed = await tx.chatbot_conversa.updateMany({ where: { id_conversa: id, versao: conversation.versao }, data: { estado: state, versao: { increment: 1 } } });
      if (!changed.count) throw new ConflictError('A conversa foi atualizada. Recarregue antes de enviar outra mensagem.');
      if (invalidate) await tx.chatbot_proposta.updateMany({ where: { id_conversa: id, status: 'Pendente' }, data: { status: 'Substituida' } });
      // A proposta ocupa o mesmo ponto cronológico da resposta que a apresentou.
      // Milissegundos distintos preservam a ordem usuário → assistente ao recuperar.
      const now = Math.max(Date.now(), ...conversation.mensagens.map((item) => new Date(item.criado_em).getTime() + 2));
      if (outcome.proposal) {
        const proposal = outcome.proposal;
        // APOIO | PESSOA 3 | ETAPA 6 — Proposta tem validade de 10 minutos, sem agendamento automático.
        await tx.chatbot_proposta.create({ data: { id_conversa: id, payload: proposal.payload, resumo: proposal.resumo, assinatura: proposal.assinatura, criado_em: new Date(now + 1), expira_em: new Date(Date.now() + 10 * 60 * 1000) } });
      }
      await tx.chatbot_mensagem.create({ data: { id_conversa: id, id_requisicao: input.id_requisicao, papel: 'user', conteudo: input.mensagem, criado_em: new Date(now) } });
      await tx.chatbot_mensagem.create({ data: { id_conversa: id, papel: 'assistant', conteudo: outcome.texto, ...(outcome.fontes ? { fontes: outcome.fontes } : {}), criado_em: new Date(now + 1) } });
    });
    return this.get(id, auth);
  }

  async proposalOwner(id, auth) {
    this.requireClient(auth);
    const proposal = await this.database.chatbot_proposta.findUnique({ where: { id_proposta: id }, include: { conversa: { select: { id_cliente: true } } } });
    if (!proposal || proposal.conversa.id_cliente !== auth.id_cliente) throw new NotFoundError('Proposta não encontrada');
    return proposal;
  }

  // POLLYANA | ETAPA 6 — Botão: revalidar e enviar a solicitação explicitamente.
  // Mostrar validade, idempotência e comparação dos dados antes de chamar o fluxo compartilhado.
  async confirm(id, auth) {
    const initial = await this.proposalOwner(id, auth);
    const result = await this.database.$transaction(async (tx) => {
      // Mesma ordem de travas usada no envio e cancelamento: conversa → proposta → diarista.
      await tx.$queryRaw`SELECT id_conversa FROM chatbot_conversa WHERE id_conversa = ${initial.id_conversa} FOR UPDATE`;
      await tx.$queryRaw`SELECT id_proposta FROM chatbot_proposta WHERE id_proposta = ${id} FOR UPDATE`;
      const proposal = await tx.chatbot_proposta.findUnique({ where: { id_proposta: id } });
      if (proposal.status === 'Confirmada') return { id_agendamento: proposal.id_agendamento };
      if (proposal.status !== 'Pendente' || new Date(proposal.expira_em) <= new Date()) throw new ConflictError('Essa proposta não está mais disponível. Peça uma nova busca ao assistente.');
      await lockDiarista(tx, proposal.payload.id_diarista);
      let current;
      try {
        // Reconsulta cadastro, preço e disponibilidade; mudanças exigem outra proposta.
        current = await this.booking.summarize(proposal.payload, auth, tx);
      } catch (error) {
        if (!(error instanceof ConflictError || error instanceof BadRequestError)) throw error;
      }
      if (!current || current.assinatura !== proposal.assinatura) {
        await tx.chatbot_proposta.update({ where: { id_proposta: id }, data: { status: 'Substituida' } });
        await tx.chatbot_conversa.update({ where: { id_conversa: initial.id_conversa }, data: { versao: { increment: 1 } } });
        return { changed: true };
      }
      // A proposta fica Confirmada; o AGENDAMENTO nasce Pendente e ainda depende do aceite da diarista.
      const appointment = await new AgendamentoWorkflowService(tx).create(createAgendamentoSchema.parse(current.payload), auth, true);
      await tx.chatbot_proposta.update({ where: { id_proposta: id }, data: { status: 'Confirmada', id_agendamento: appointment.id_agendamento } });
      await tx.chatbot_conversa.update({ where: { id_conversa: initial.id_conversa }, data: { estado: {}, versao: { increment: 1 } } });
      await tx.chatbot_mensagem.create({ data: { id_conversa: initial.id_conversa, papel: 'assistant', conteudo: `Solicitação #${appointment.id_agendamento} enviada. Aguardando resposta da diarista. Acompanhe pelo Histórico.` } });
      return { id_agendamento: appointment.id_agendamento };
    }, { isolationLevel: 'ReadCommitted', timeout: 15000 });
    if (result.changed) throw new ConflictError('Os dados ou preços mudaram. Peça uma nova proposta e confirme os valores atualizados.');
    return { ...result, conversa: await this.get(initial.id_conversa, auth) };
  }

  async cancel(id, auth) {
    const proposal = await this.proposalOwner(id, auth);
    await this.database.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT id_conversa FROM chatbot_conversa WHERE id_conversa = ${proposal.id_conversa} FOR UPDATE`;
      const current = await tx.chatbot_proposta.findUnique({ where: { id_proposta: id } });
      if (current.status === 'Confirmada') throw new ConflictError('A solicitação já foi enviada. Utilize o Histórico para cancelar o agendamento.');
      if (current.status === 'Cancelada') return;
      if (current.status !== 'Pendente') throw new ConflictError('Essa proposta já foi encerrada.');
      await tx.chatbot_proposta.update({ where: { id_proposta: id }, data: { status: 'Cancelada' } });
      await tx.chatbot_conversa.update({ where: { id_conversa: proposal.id_conversa }, data: { estado: {}, versao: { increment: 1 } } });
      await tx.chatbot_mensagem.create({ data: { id_conversa: proposal.id_conversa, papel: 'assistant', conteudo: 'Proposta cancelada. Nenhuma solicitação foi enviada. Posso ajudar com outra busca.' } });
    });
    return this.get(proposal.id_conversa, auth);
  }
}

const ref = (name) => ({ $ref: `#/components/schemas/${name}` });
const json = (schema) => ({ 'application/json': { schema } });
const uuid = { type: 'string', format: 'uuid' };
const id = { name: 'id', in: 'path', required: true, schema: uuid };
const response = (schema) => ({ description: 'Operação concluída.', content: json(ref(schema)) });
const errors = {
  '401': { description: 'Sessão ausente ou inválida.' },
  '403': { description: 'Exige perfil ativo de cliente.' },
  '404': { description: 'Recurso inexistente ou pertencente a outro cliente.' },
  '409': { description: 'Proposta alterada, encerrada, expirada ou disponibilidade indisponível. Atualize a conversa e solicite uma nova busca.' },
  '422': { description: 'Corpo ou identificador inválido.' },
  '429': { description: 'Limite de 20 requisições por minuto por usuário.' },
  '503': { description: 'Gemini não configurado, falha externa ou embeddings indisponíveis.' },
};
const op = (operationId, summary, schema = 'ChatbotConversa') => ({ tags: ['Assistente'], operationId, summary, security: [{ bearerAuth: [] }], responses: { '200': response(schema), ...errors } });
const body = (schema) => ({ required: true, content: json(ref(schema)) });

export const chatbotPaths = {
  '/api/chatbot/conversas': {
    get: {
      ...op('listarConversasChatbot', 'Listar as próprias conversas anteriores', 'ChatbotConversaLista'),
      parameters: [
        { name: 'page', in: 'query', schema: { type: 'integer', minimum: 1, maximum: 100000, default: 1 } },
        { name: 'limit', in: 'query', schema: { type: 'integer', minimum: 1, maximum: 50, default: 20 } },
      ],
      description: 'Lista somente conversas do cliente autenticado, da atualização mais recente para a mais antiga. O título é um resumo da primeira mensagem do cliente; conversas ainda sem perguntas usam Nova conversa. Não cria ou modifica conversas. Para retomar, use GET /api/chatbot/conversas/{id}.',
    },
    post: { ...op('criarConversaChatbot', 'Iniciar ou retomar a conversa mais recente'), requestBody: body('ChatbotConversaCreate') },
  },
  '/api/chatbot/conversas/{id}': { get: { ...op('buscarConversaChatbot', 'Consultar a própria conversa e proposta atual'), parameters: [id] } },
  '/api/chatbot/conversas/{id}/mensagens': { post: { ...op('enviarMensagemChatbot', 'Interpretar mensagem e responder ou preparar uma proposta'), parameters: [id], requestBody: body('ChatbotMensagemCreate'), description: 'Usa Gemini para interpretação e RAG para dúvidas sobre regras da plataforma. Perguntas sobre o perfil, serviços e combos de uma diarista consultam o catálogo público atual no banco, com preços e serviços incluídos. A conversa mantém a referência da profissional para perguntas posteriores. Nomes ambíguos exigem esclarecimento. Consultas não criam nem alteram propostas ou agendamentos e não garantem disponibilidade. A mesma id_requisicao não deve ser processada duas vezes. Dados de contratação vêm dos Services e do banco.' } },
  '/api/chatbot/propostas/{id}/confirmar': { post: { ...op('confirmarPropostaChatbot', 'Revalidar e enviar uma solicitação pendente à diarista', 'ChatbotConfirmacao'), parameters: [id], description: 'Confirmação explícita e idempotente. Revalida endereço, preços e disponibilidade. Propostas valem 10 minutos. Solicitação criada com status Pendente, dependendo do aceite da diarista. Mudanças exigem nova proposta.' } },
  '/api/chatbot/propostas/{id}/cancelar': { post: { ...op('cancelarPropostaChatbot', 'Cancelar proposta ainda não enviada'), parameters: [id], description: 'Não cancela agendamentos já enviados. Para esses, utilize o endpoint de cancelamento de agendamento.' } },
};

export const chatbotSchemas = {
  ChatbotConversaItem: { type: 'object', required: ['id_conversa', 'titulo', 'criado_em', 'atualizado_em', 'total_mensagens'], properties: {
    id_conversa: uuid, titulo: { type: 'string', maxLength: 100 }, criado_em: { type: 'string', format: 'date-time' }, atualizado_em: { type: 'string', format: 'date-time' }, total_mensagens: { type: 'integer', minimum: 0 },
  } },
  ChatbotConversaLista: { type: 'object', required: ['data', 'pagination'], properties: {
    data: { type: 'array', items: ref('ChatbotConversaItem') },
    pagination: { type: 'object', required: ['page', 'limit', 'total', 'pages'], properties: { page: { type: 'integer', minimum: 1 }, limit: { type: 'integer', minimum: 1, maximum: 50 }, total: { type: 'integer', minimum: 0 }, pages: { type: 'integer', minimum: 0 } } },
  } },
  ChatbotConversaCreate: { type: 'object', additionalProperties: false, properties: { nova: { type: 'boolean', default: false, description: 'false retoma a conversa mais recente; true inicia outra.' } } },
  ChatbotSelecao: { type: 'object', additionalProperties: false, minProperties: 1, maxProperties: 1, properties: { id_endereco: { type: 'integer', minimum: 1 }, id_servico: { type: 'integer', minimum: 1 }, id_combo_base: { type: 'integer', minimum: 1, nullable: true } } },
  ChatbotMensagemCreate: { type: 'object', additionalProperties: false, required: ['id_requisicao', 'mensagem'], properties: { id_requisicao: uuid, mensagem: { type: 'string', minLength: 1, maxLength: 2000 }, selecao: ref('ChatbotSelecao') } },
  ChatbotFonte: { type: 'object', required: ['id', 'titulo'], properties: { id: { type: 'string' }, titulo: { type: 'string' } } },
  ChatbotMensagem: { type: 'object', required: ['id_mensagem', 'papel', 'conteudo', 'criado_em'], properties: { id_mensagem: uuid, papel: { type: 'string', enum: ['user', 'assistant'] }, conteudo: { type: 'string' }, criado_em: { type: 'string', format: 'date-time' }, fontes: { type: 'array', nullable: true, items: ref('ChatbotFonte') } } },
  ChatbotResumo: { type: 'object', required: ['diarista', 'data', 'horario_inicio', 'endereco', 'qtd_comodos', 'tamanho_casa', 'servicos', 'valor_estimado'], properties: {
    diarista: { type: 'object', required: ['id_diarista', 'nome'], properties: { id_diarista: { type: 'integer' }, nome: { type: 'string' }, foto_perfil: { type: 'string', nullable: true } } },
    data: { type: 'string', format: 'date' }, horario_inicio: { type: 'string', example: '09:00' }, endereco: { type: 'string' }, qtd_comodos: { type: 'integer' }, tamanho_casa: { type: 'string', enum: ['pequena', 'media', 'grande'] },
    servicos: { type: 'array', items: { type: 'object', required: ['id_diarista_servico', 'nome', 'preco'], properties: { id_diarista_servico: { type: 'integer' }, nome: { type: 'string' }, preco: { type: 'number' } } } },
    combo: { type: 'string', nullable: true }, valor_estimado: { type: 'number' }, distancia_km: { type: 'number', description: 'Distância geográfica aproximada por CEP.' },
  } },
  ChatbotProposta: { type: 'object', nullable: true, required: ['id_proposta', 'status', 'resumo', 'criado_em', 'expira_em'], properties: { id_proposta: uuid, status: { type: 'string', enum: ['Pendente', 'Confirmada', 'Cancelada', 'Substituida', 'Expirada'] }, resumo: ref('ChatbotResumo'), criado_em: { type: 'string', format: 'date-time', description: 'Momento de criação da proposta para posicionar o card na conversa. Não muda ao confirmar ou cancelar.' }, expira_em: { type: 'string', format: 'date-time' }, id_agendamento: { type: 'integer', nullable: true } } },
  ChatbotOpcao: { type: 'object', required: ['tipo', 'id', 'label'], properties: { tipo: { type: 'string', enum: ['servico', 'endereco', 'combo'] }, id: { type: 'integer', nullable: true }, label: { type: 'string' } } },
  ChatbotConversa: { type: 'object', required: ['id_conversa', 'versao', 'mensagens', 'proposta', 'opcoes'], properties: { id_conversa: uuid, versao: { type: 'integer' }, mensagens: { type: 'array', items: ref('ChatbotMensagem') }, proposta: ref('ChatbotProposta'), opcoes: { type: 'array', items: ref('ChatbotOpcao') } } },
  ChatbotConfirmacao: { type: 'object', required: ['id_agendamento', 'conversa'], properties: { id_agendamento: { type: 'integer' }, conversa: ref('ChatbotConversa') } },
};

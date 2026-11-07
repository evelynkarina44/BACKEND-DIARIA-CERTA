const auth = [{ bearerAuth: [] }];
const schema = name => ({ $ref: '#/components/schemas/' + name });
const response = (description, value) => ({ description, content: { 'application/json': { schema: value } } });
const errors = { '401': { description: 'Sessão ausente ou inválida.' }, '403': { description: 'Perfil ativo inválido.' } };
export const notificationPaths = {
  '/api/notificacoes': { get: {
    tags: ['Notificações'], operationId: 'listarNotificacoes', summary: 'Consultar novidades das diárias do perfil ativo', security: auth,
    description: 'Central interna dos últimos 30 dias, derivada dos registros reais. Não envia push, cria cobranças nem consulta o provedor de pagamento. IDs estáveis evitam duplicidade; leitura é persistida por usuário e perfil.',
    parameters: [
      { name: 'page', in: 'query', schema: { type: 'integer', minimum: 1, default: 1 } },
      { name: 'limit', in: 'query', schema: { type: 'integer', minimum: 1, maximum: 100, default: 20 } },
    ],
    responses: { '200': response('Notificações paginadas e total não lido.', {
      type: 'object', properties: { data: { type: 'array', items: schema('AppNotification') }, nao_lidas: { type: 'integer' },
        atualizado_em: { type: 'string', format: 'date-time' }, pagination: { type: 'object', properties: { page: { type: 'integer' }, limit: { type: 'integer' }, total: { type: 'integer' }, pages: { type: 'integer' } } } },
    }), ...errors },
  } },
  '/api/notificacoes/{id}/lida': { put: {
    tags: ['Notificações'], operationId: 'marcarNotificacaoLida', summary: 'Marcar uma notificação própria como lida', security: auth,
    parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', pattern: '^[a-f0-9]{64}$' } }],
    responses: { '200': response('Leitura registrada de forma idempotente.', { type: 'object', properties: { id: { type: 'string' }, lida: { type: 'boolean' } } }), ...errors,
      '404': { description: 'Notificação ausente ou de outro perfil/usuário.' }, '422': { description: 'ID inválido.' } },
  } },
  '/api/notificacoes/marcar-todas-lidas': { post: {
    tags: ['Notificações'], operationId: 'marcarTodasNotificacoesLidas', summary: 'Marcar as notificações atuais do perfil como lidas', security: auth,
    requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', additionalProperties: false } } } },
    responses: { '200': response('Não altera notificações futuras nem o outro perfil.', { type: 'object', properties: { marcadas: { type: 'integer' } } }), ...errors },
  } },
};
export const notificationSchemas = {
  AppNotification: { type: 'object', properties: {
    id: { type: 'string' }, id_agendamento: { type: 'integer' }, tipo: { type: 'string' }, titulo: { type: 'string' }, mensagem: { type: 'string' },
    criado_em: { type: 'string', format: 'date-time' }, lida: { type: 'boolean' },
    acao: { type: 'string', enum: ['pagamento', 'diaria', 'acompanhar', 'avaliacao'] },
  } },
};

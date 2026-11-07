const id = { name: 'id', in: 'path', required: true, schema: { type: 'integer', minimum: 1 } };
const ref = (name) => ({ $ref: `#/components/schemas/${name}` });
const json = (schema) => ({ 'application/json': { schema } });
const errors = {
  '401': { description: 'Autenticação ausente ou assinatura inválida.' },
  '403': { description: 'Somente participantes; só o cliente titular pode pagar.' },
  '404': { description: 'Agendamento não encontrado.' },
  '409': { description: 'Parcela já paga, fase não liberada ou operação concorrente.' },
  '422': { description: 'Campos inválidos; preço e identidade não são aceitos no corpo.' },
  '429': { description: 'Limite de consultas atingido.' },
  '502': { description: 'Falha temporária do Mercado Pago.' },
  '503': { description: 'Configuração do pagamento incompleta ou desabilitada.' },
};
const operation = (operationId, summary, schema) => ({
  tags: ['Pagamentos'], operationId, summary, parameters: [id], security: [{ bearerAuth: [] }],
  responses: { '200': { description: 'Resultado confirmado pelo backend.', content: json(ref(schema)) }, ...errors },
});

export const pagamentoPaths = {
  '/api/pagamento/agendamento/{id}': { get: operation('consultarPagamento', 'Consultar entrada e saldo da diária', 'PagamentoResumo') },
  '/api/pagamento/agendamento/{id}/checkout': { post: {
    ...operation('abrirCheckoutPagamento', 'Obter link seguro do Mercado Pago para uma parcela', 'PagamentoCheckout'),
    description: 'Entrada de 50% após o aceite; saldo após o checkout. Valor calculado no servidor, sem repasse automático.',
    requestBody: { required: true, content: json({ type: 'object', additionalProperties: false, required: ['fase'], properties: { fase: { type: 'string', enum: ['Entrada', 'Saldo'] } } }) },
  } },
  '/api/pagamento/agendamento/{id}/sincronizar': { post: {
    ...operation('sincronizarPagamento', 'Reconsultar as transações reais no Mercado Pago', 'PagamentoResumo'),
    requestBody: { required: false, content: json({ type: 'object', additionalProperties: false }) },
  } },
  '/api/pagamento/webhook': { post: {
    tags: ['Pagamentos'], operationId: 'receberWebhookPagamento', summary: 'Receber notificação assinada do Mercado Pago',
    description: 'Sem JWT: exige HMAC válido em x-signature e consulta autenticada à API. Notificações repetidas não duplicam pagamentos. Configure o evento payment.',
    security: [],
    parameters: [
      { name: 'data.id', in: 'query', required: true, schema: { type: 'string', pattern: '^\\d+$' } },
      { name: 'x-signature', in: 'header', required: true, schema: { type: 'string' } },
      { name: 'x-request-id', in: 'header', required: true, schema: { type: 'string' } },
    ],
    requestBody: { required: true, content: json({ type: 'object', properties: { type: { type: 'string', enum: ['payment'] }, data: { type: 'object', properties: { id: { type: 'string' } } } } }) },
    responses: { '200': { description: 'Notificação processada ou referência não pertencente à plataforma.' }, ...errors },
  } },
};

export const pagamentoSchemas = {
  PagamentoParcela: { type: 'object', required: ['fase', 'valor', 'status', 'pode_pagar', 'estorno_pendente'], properties: {
    fase: { type: 'string', enum: ['Entrada', 'Saldo'] }, valor: { type: 'number' },
    status: { type: 'string', enum: ['Pendente', 'Pago', 'Falhou', 'Estornado', 'Estorno_pendente', 'Em_disputa'] },
    pode_pagar: { type: 'boolean' }, estorno_pendente: { type: 'boolean' },
  } },
  PagamentoResumo: { type: 'object', required: ['id_agendamento', 'status_agendamento', 'valor_total', 'moeda', 'quitado', 'parcelas'], properties: {
    id_agendamento: { type: 'integer' }, status_agendamento: ref('AgendamentoStatus'), valor_total: { type: 'number' },
    moeda: { type: 'string', enum: ['BRL'] }, quitado: { type: 'boolean' }, parcelas: { type: 'array', items: ref('PagamentoParcela') },
    pode_avaliar: { type: 'boolean', description: 'Diária concluída, duas parcelas pagas e ainda não avaliada pelo cliente.' },
    avaliacao_cliente: { type: 'object', nullable: true, properties: { id_avaliacao: { type: 'integer' }, nota: { type: 'number' }, comentario: { type: 'string', nullable: true } } },
  } },
  PagamentoCheckout: { type: 'object', required: ['checkout_url', 'fase'], properties: {
    checkout_url: { type: 'string', format: 'uri' }, fase: { type: 'string', enum: ['Entrada', 'Saldo'] },
  } },
};

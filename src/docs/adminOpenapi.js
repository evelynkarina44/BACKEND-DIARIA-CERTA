const status = { type: 'string', enum: ['Pendente', 'EmAnalise', 'Resolvida', 'Arquivada'] };
const id = { name: 'id', in: 'path', required: true, schema: { type: 'integer', minimum: 1 } };
const ref = name => ({ $ref: '#/components/schemas/' + name });
const response = schema => ({ description: 'Operação concluída.', content: { 'application/json': { schema } } });
const errors = { 401: { description: 'Sessão ausente ou expirada.' }, 403: { description: 'Exige perfil ADMIN e permissão atual no banco.' }, 422: { description: 'Dados inválidos.' } };
const common = { tags: ['Administração'], security: [{ bearerAuth: [] }], description: 'Acesso exclusivo da administração. Resposta privada, sem cache. Medidas exigem justificativa e não apagam o histórico financeiro.' };
export const adminSchemas = {
  AdminDenuncia: { type: 'object', properties: {
    id_denuncia: { type: 'integer' }, status, versao: { type: 'integer', minimum: 0 }, motivo: { type: 'string' }, descricao: { type: 'string', nullable: true }, data_denuncia: { type: 'string', format: 'date-time' },
    denunciante: { type: 'object', description: 'ID, nome, e-mail e tipo de perfil; sem CPF, telefone ou senha.' }, denunciado: { type: 'object' },
    analises: { type: 'array', description: 'Histórico interno presente somente no detalhamento.', items: { type: 'object', properties: { status, observacao: { type: 'string' }, criado_em: { type: 'string', format: 'date-time' }, administrador: { type: 'object' } } } },
  } },
  AdminAnalise: { type: 'object', additionalProperties: false, required: ['status', 'observacao', 'versao'], properties: {
    decisao_reembolso: { type: 'string', enum: ['EmAnalise','Aprovado','Negado'], description: 'Decisão administrativa, sem execução financeira. Obrigatória para concluir pedido de reembolso. Arquivamento exige Negado.' },
    status: { type: 'string', enum: ['EmAnalise', 'Resolvida', 'Arquivada'] }, observacao: { type: 'string', minLength: 1, maxLength: 2000 }, versao: { type: 'integer', minimum: 0 },
    acao: { type: 'string', enum: ['Nenhuma','Suspender','Excluir'], default: 'Nenhuma' }, dias_suspensao: { type: 'integer', minimum: 1, maximum: 365 },
  } },
};
export const adminPaths = {
  '/api/admin/usuarios': { get: { ...common, summary: 'Consultar tabela e total de usuários', operationId: 'adminListarUsuarios', parameters: [
    { name:'page',in:'query',schema:{type:'integer',minimum:1,default:1} },{name:'limit',in:'query',schema:{type:'integer',minimum:1,maximum:100,default:20}},{name:'busca',in:'query',schema:{type:'string',maxLength:100}},
  ],responses:{200:response({type:'object',properties:{data:{type:'array',items:{type:'object'}},total_usuarios:{type:'integer'},pagination:ref('Pagination')}}),...errors}}},
  '/api/denuncia/{id}/anexos': { post: { ...common, tags:['Denúncias'],description:'Somente o denunciante pode enviar até três imagens enquanto a denúncia estiver pendente. Arquivos de até 5 MB, JPG/PNG/WebP, reencodados e privados.',summary:'Anexar imagem à denúncia',operationId:'anexarImagemDenuncia',parameters:[id],requestBody:{required:true,content:{'application/octet-stream':{schema:{type:'string',format:'binary'}}}},responses:{201:response({type:'object',properties:{id_anexo:{type:'string',format:'uuid'}}}),...errors,409:{description:'Denúncia alterada ou em análise.'},413:{description:'Imagem maior que 5 MB.'},415:{description:'Tipo de conteúdo inválido.'}} } },
  '/api/denuncia/{id}/anexos/{anexo}': { get: { ...common,tags:['Denúncias'],description:'Acesso exclusivo do denunciante e do administrador. Nunca é servido por URL pública.',summary:'Visualizar imagem privada da denúncia',operationId:'verImagemDenuncia',parameters:[id,{name:'anexo',in:'path',required:true,schema:{type:'string',format:'uuid'}}],responses:{200:response({type:'object',properties:{dataUrl:{type:'string'},id_anexo:{type:'string'}}}),...errors,404:{description:'Imagem não encontrada.'}} } },
  '/api/admin/denuncias': { get: { ...common, summary: 'Listar denúncias para análise', operationId: 'adminListarDenuncias', parameters: [
    { name: 'somente_reembolso', in: 'query', schema: { type: 'boolean' }, description: 'Mostrar somente denúncias com pedido de reembolso.' },
    { name: 'page', in: 'query', schema: { type: 'integer', minimum: 1, default: 1 } },
    { name: 'limit', in: 'query', schema: { type: 'integer', minimum: 1, maximum: 100, default: 20 } },
    { name: 'status', in: 'query', schema: status }, { name: 'busca', in: 'query', schema: { type: 'string', maxLength: 100 } },
  ], responses: { 200: response({ type: 'object', properties: { data: { type: 'array', items: ref('AdminDenuncia') }, pagination: ref('Pagination') } }), ...errors } } },
  '/api/admin/denuncias/{id}': { get: { ...common, summary: 'Consultar denúncia e histórico', operationId: 'adminDetalharDenuncia', parameters: [id], responses: { 200: response(ref('AdminDenuncia')), ...errors, 404: { description: 'Denúncia não encontrada.' } } } },
  '/api/admin/denuncias/{id}/analises': { post: { ...common, summary: 'Registrar decisão administrativa', operationId: 'adminAnalisarDenuncia', parameters: [id], requestBody: { required: true, content: { 'application/json': { schema: ref('AdminAnalise') } } }, responses: { 200: response(ref('AdminDenuncia')), ...errors, 409: { description: 'Versão desatualizada. Recarregue antes de salvar.' } } } },
};

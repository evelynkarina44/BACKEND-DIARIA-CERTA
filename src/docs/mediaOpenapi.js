const id = { name: 'id', in: 'path', required: true, schema: { type: 'integer', minimum: 1 } };
const anexo = { name: 'anexo', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } };
const errors = { 400: { description: 'Arquivo inválido.' }, 401: { description: 'Autenticação necessária.' }, 403: { description: 'Sem acesso ao anexo.' }, 404: { description: 'Registro não encontrado.' }, 409: { description: 'Registro alterado. Tente novamente.' }, 413: { description: 'Foto maior que 5 MB ou vídeo maior que 10 MB.' }, 429: { description: 'Limite de envios atingido.' } };
export const mediaPaths = {};
for (const [resource, tag] of [['avaliacao', 'Avaliações'], ['denuncia', 'Denúncias']]) {
 mediaPaths['/api/' + resource + '/{id}/anexos'] = { post: {
  tags: [tag], operationId: resource + 'AnexarMidia', summary: 'Anexar foto ou vídeo', security: [{ bearerAuth: [] }],
  description: 'Somente o autor. Até três anexos por registro: JPG/PNG/WebP até 5 MB (reencodadas sem metadados), MP4 H.264 não fragmentado até 10 MB e 60 segundos (não transcodificado). Denúncias só aceitam anexos enquanto pendentes.',
  parameters: [id, { name: 'X-Anexo-Id', in: 'header', description: 'Chave estável para retomar upload sem duplicar o arquivo.', schema: { type: 'string', minLength: 16, maxLength: 80 } }],
  requestBody: { required: true, content: { 'application/octet-stream': { schema: { type: 'string', format: 'binary' } } } },
  responses: { 201: { description: 'Anexo registrado ou já existente para a chave.', content: { 'application/json': { schema: { type: 'object', properties: { id_anexo: { type: 'string', format: 'uuid' }, tipo: { type: 'string', enum: ['image','video'] }, mime: { type: 'string' } } } } } }, ...errors },
 } };
 mediaPaths['/api/' + resource + '/{id}/anexos/{anexo}'] = { get: {
  tags: [tag], operationId: resource + 'LerMidia', summary: 'Visualizar foto ou vídeo anexado',
  security: resource === 'denuncia' ? [{ bearerAuth: [] }] : [{}, { bearerAuth: [] }],
  description: resource === 'denuncia' ? 'Privado: apenas denunciante ou administrador. Sem cache.' : 'Segue a visibilidade atual da avaliação: pública ou apenas participantes da diária. Sem cache.',
  parameters: [id, anexo], responses: { 200: { description: 'Anexo em data URI, carregado somente ao abrir.', content: { 'application/json': { schema: { type: 'object', properties: { id_anexo: { type: 'string' }, tipo: { type: 'string' }, mime: { type: 'string' }, dataUrl: { type: 'string' } } } } } }, ...errors },
 } };
}

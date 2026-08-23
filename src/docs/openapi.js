const id = {
  name: 'id',
  in: 'path',
  required: true,
  description: 'Identificador numérico do recurso.',
  schema: { type: 'integer', minimum: 1 },
};

const paginationParameters = [
  {
    name: 'page',
    in: 'query',
    description: 'Página solicitada.',
    schema: { type: 'integer', minimum: 1, default: 1 },
  },
  {
    name: 'limit',
    in: 'query',
    description: 'Quantidade máxima de registros (até 100).',
    schema: { type: 'integer', minimum: 1, maximum: 100, default: 20 },
  },
];

const bearerSecurity = [{ bearerAuth: [] }];
const json = (schema) => ({ 'application/json': { schema } });
const schemaRef = (name) => ({ $ref: `#/components/schemas/${name}` });
const responseRef = (name) => ({ $ref: `#/components/responses/${name}` });

function successResponse(description, schema) {
  return {
    description,
    ...(schema ? { content: json(schema) } : {}),
  };
}

function requestBody(schemaName, required = true) {
  return {
    required,
    content: json(schemaRef(schemaName)),
  };
}

function standardErrors({ authenticated = false, forbidden = false, notFound = false, conflict = false } = {}) {
  return {
    '422': responseRef('ValidationError'),
    ...(authenticated ? { '401': responseRef('Unauthorized') } : {}),
    ...(forbidden ? { '403': responseRef('Forbidden') } : {}),
    ...(notFound ? { '404': responseRef('NotFound') } : {}),
    ...(conflict ? { '409': responseRef('Conflict') } : {}),
    '500': responseRef('InternalError'),
  };
}

function paginatedSchema(itemName) {
  return {
    type: 'object',
    required: ['data', 'pagination'],
    properties: {
      data: { type: 'array', items: schemaRef(itemName) },
      pagination: schemaRef('Pagination'),
    },
  };
}

function listSchema(itemName, paginated) {
  return paginated
    ? paginatedSchema(itemName)
    : { type: 'array', items: schemaRef(itemName) };
}

const paths = {};

function addCrud({
  base,
  tag,
  singular,
  plural,
  resource,
  createSchema,
  updateSchema,
  paginated = false,
  security = {},
  descriptions = {},
  allow = { list: true, find: true, create: true, update: true, delete: true },
}) {
  const listAuthenticated = Boolean(security.list);
  const createAuthenticated = Boolean(security.create);
  const findAuthenticated = Boolean(security.find);
  const updateAuthenticated = Boolean(security.update);
  const deleteAuthenticated = Boolean(security.delete);

  paths[base] = {
    ...(allow.list ? {
      get: {
        tags: [tag],
        summary: `Listar ${plural}`,
        description: descriptions.list,
        operationId: `listar${resource}`,
        parameters: paginationParameters,
        ...(listAuthenticated ? { security: bearerSecurity } : {}),
        responses: {
          '200': successResponse(`${plural} retornados com sucesso.`, listSchema(resource, paginated)),
          ...standardErrors({ authenticated: listAuthenticated, forbidden: security.list === 'role' }),
        },
      },
    } : {}),
    ...(allow.create ? {
      post: {
        tags: [tag],
        summary: `Criar ${singular}`,
        description: descriptions.create,
        operationId: `criar${resource}`,
        ...(createAuthenticated ? { security: bearerSecurity } : {}),
        requestBody: requestBody(createSchema),
        responses: {
          '201': successResponse(`${singular} criado com sucesso.`, schemaRef(resource)),
          ...standardErrors({ authenticated: createAuthenticated, forbidden: security.create === 'role', conflict: true }),
        },
      },
    } : {}),
  };

  paths[`${base}/{id}`] = {
    ...(allow.find ? {
      get: {
        tags: [tag],
        summary: `Buscar ${singular} por ID`,
        description: descriptions.find,
        operationId: `buscar${resource}PorId`,
        parameters: [id],
        ...(findAuthenticated ? { security: bearerSecurity } : {}),
        responses: {
          '200': successResponse(`${singular} encontrado.`, schemaRef(resource)),
          ...standardErrors({ authenticated: findAuthenticated, forbidden: security.find === 'role', notFound: true }),
        },
      },
    } : {}),
    ...(allow.update ? {
      put: {
        tags: [tag],
        summary: `Atualizar ${singular}`,
        description: descriptions.update,
        operationId: `atualizar${resource}`,
        parameters: [id],
        ...(updateAuthenticated ? { security: bearerSecurity } : {}),
        requestBody: requestBody(updateSchema),
        responses: {
          '200': successResponse(`${singular} atualizado com sucesso.`, schemaRef(resource)),
          ...standardErrors({ authenticated: updateAuthenticated, forbidden: security.update === 'role', notFound: true, conflict: true }),
        },
      },
    } : {}),
    ...(allow.delete ? {
      delete: {
        tags: [tag],
        summary: `Excluir ${singular}`,
        description: descriptions.delete,
        operationId: `excluir${resource}`,
        parameters: [id],
        ...(deleteAuthenticated ? { security: bearerSecurity } : {}),
        responses: {
          '204': successResponse(`${singular} excluído com sucesso.`),
          ...standardErrors({ authenticated: deleteAuthenticated, forbidden: security.delete === 'role', notFound: true, conflict: true }),
        },
      },
    } : {}),
  };
}

paths['/health'] = {
  get: {
    tags: ['Sistema'],
    summary: 'Verificar saúde da API',
    operationId: 'verificarSaude',
    responses: {
      '200': successResponse('API disponível.', schemaRef('Health')), 
    },
  },
};

paths['/api-docs.json'] = {
  get: {
    tags: ['Sistema'],
    summary: 'Obter contrato OpenAPI',
    description: 'Retorna esta especificação OpenAPI em JSON.',
    operationId: 'obterOpenApi',
    responses: {
      '200': successResponse('Contrato OpenAPI.', { type: 'object', additionalProperties: true }),
    },
  },
};

paths['/api/auth/login'] = {
  post: {
    tags: ['Autenticação'],
    summary: 'Autenticar usuário',
    description: 'Valida e-mail e senha e emite um token JWT Bearer.',
    operationId: 'login',
    requestBody: requestBody('LoginRequest'),
    responses: {
      '200': successResponse('Autenticação realizada.', schemaRef('LoginResponse')),
      '401': responseRef('Unauthorized'),
      '429': { description: 'Muitas tentativas de login.' },
      ...standardErrors(),
    },
  },
};

paths['/api/auth/me'] = {
  get: {
    tags: ['Autenticação'],
    summary: 'Consultar sessão atual',
    description: 'Retorna o usuário associado ao token JWT.',
    operationId: 'consultarSessao',
    security: bearerSecurity,
    responses: {
      '200': successResponse('Sessão válida.', schemaRef('Usuario')),
      ...standardErrors({ authenticated: true }),
    },
  },
};

paths['/api/auth/select-profile'] = {
  post: {
    tags: ['Autenticação'],
    summary: 'Selecionar perfil ativo',
    description: 'Seleciona um perfil pertencente ao usuário autenticado e emite um novo JWT limitado a esse contexto.',
    operationId: 'selecionarPerfilAtivo',
    security: bearerSecurity,
    requestBody: requestBody('SelectProfileRequest'),
    responses: {
      '200': successResponse('Perfil ativo selecionado.', schemaRef('LoginResponse')),
      ...standardErrors({ authenticated: true, forbidden: true }),
    },
  },
};

addCrud({
  base: '/api/usuario', tag: 'Usuários', singular: 'usuário', plural: 'usuários', resource: 'Usuario',
  createSchema: 'UsuarioCreate', updateSchema: 'UsuarioUpdate', paginated: true,
  security: { list: true, find: true, update: true, delete: true },
  descriptions: {
    create: 'Cadastro público de uma conta de usuário. A senha é armazenada com hash e não é devolvida.',
    list: 'Retorna somente a conta do usuário autenticado.',
    find: 'Consulta uma conta conforme as regras de acesso do serviço.',
  },
});

addCrud({
  base: '/api/cliente', tag: 'Clientes', singular: 'cliente', plural: 'clientes', resource: 'Cliente',
  createSchema: 'ClienteCreate', updateSchema: 'ClienteUpdate', paginated: true,
  security: { list: true, find: true, create: true, update: true, delete: true },
  descriptions: { list: 'Retorna o perfil de cliente ligado à sessão autenticada.' },
});

addCrud({
  base: '/api/diarista', tag: 'Diaristas', singular: 'diarista', plural: 'diaristas', resource: 'Diarista',
  createSchema: 'DiaristaCreate', updateSchema: 'DiaristaUpdate', paginated: true,
  security: { create: true, update: 'role', delete: 'role' },
  descriptions: {
    list: 'Pesquisa perfis públicos por nome, localização, avaliação, preço e serviço.',
    find: 'Retorna o perfil público detalhado, incluindo serviços, combos, agenda e avaliações públicas.',
    update: 'Exige token com perfil de diarista.',
    delete: 'Exige token com perfil de diarista.',
  },
});

paths['/api/diarista'].get.parameters = [
  ...paginationParameters,
  { name: 'nome', in: 'query', schema: { type: 'string', maxLength: 100 } },
  { name: 'bairro', in: 'query', schema: { type: 'string', maxLength: 100 } },
  { name: 'cidade', in: 'query', schema: { type: 'string', maxLength: 100 } },
  { name: 'estado', in: 'query', schema: { type: 'string', minLength: 2, maxLength: 2 } },
  { name: 'avaliacao_min', in: 'query', schema: { type: 'number', minimum: 0, maximum: 5 } },
  { name: 'preco_min', in: 'query', schema: { type: 'number', minimum: 0 } },
  { name: 'preco_max', in: 'query', schema: { type: 'number', minimum: 0 } },
  { name: 'id_servico', in: 'query', schema: { type: 'integer', minimum: 1 } },
  { name: 'cep_origem', in: 'query', description: 'CEP do cliente usado como origem do cálculo de distância.', schema: { type: 'string', pattern: '^\\d{5}-?\\d{3}$' } },
  { name: 'distancia_max', in: 'query', description: 'Distância máxima em quilômetros. Exige cep_origem.', schema: { type: 'number', minimum: 0, exclusiveMinimum: true, maximum: 5000 } },
  { name: 'ordenar', in: 'query', schema: { type: 'string', enum: ['avaliacao', 'preco_asc', 'preco_desc', 'nome', 'distancia'], default: 'avaliacao' } },
];

paths['/api/diarista/{id}/estatisticas'] = {
  get: {
    tags: ['Diaristas'],
    summary: 'Consultar estatísticas da diarista',
    description: 'Disponível apenas para a própria diarista autenticada.',
    operationId: 'buscarEstatisticasDiarista',
    parameters: [id],
    security: bearerSecurity,
    responses: {
      '200': successResponse('Estatísticas calculadas.', schemaRef('DiaristaEstatisticas')),
      ...standardErrors({ authenticated: true, forbidden: true, notFound: true }),
    },
  },
};

addCrud({
  base: '/api/endereco', tag: 'Endereços', singular: 'endereço', plural: 'endereços', resource: 'Endereco',
  createSchema: 'EnderecoCreate', updateSchema: 'EnderecoUpdate', paginated: true,
  security: { list: true, find: true, create: true, update: true, delete: true },
  descriptions: { list: 'Retorna somente endereços pertencentes aos perfis do usuário autenticado.' },
});

addCrud({
  base: '/api/servico', tag: 'Serviços', singular: 'serviço', plural: 'serviços', resource: 'Servico',
  createSchema: 'ServicoCreate', updateSchema: 'ServicoUpdate',
  security: { create: true, update: true, delete: true },
});

addCrud({
  base: '/api/diarista-servico', tag: 'Serviços da diarista', singular: 'serviço da diarista', plural: 'serviços da diarista', resource: 'DiaristaServico',
  createSchema: 'DiaristaServicoCreate', updateSchema: 'DiaristaServicoUpdate',
  security: { create: 'role', update: 'role', delete: 'role' },
  descriptions: {
    create: 'Exige perfil de diarista e vínculo com o próprio id_diarista.',
    update: 'Somente a diarista proprietária pode alterar o serviço.',
    delete: 'Somente a diarista proprietária pode excluir o serviço.',
  },
});

addCrud({
  base: '/api/combo-base', tag: 'Combos base', singular: 'combo base', plural: 'combos base', resource: 'ComboBase',
  createSchema: 'ComboBaseCreate', updateSchema: 'ComboBaseUpdate',
  security: { create: 'role', update: 'role', delete: 'role' },
  descriptions: { create: 'Exige perfil de diarista e vínculo com o próprio id_diarista.' },
});

addCrud({
  base: '/api/combo-servico', tag: 'Serviços dos combos', singular: 'serviço do combo', plural: 'serviços dos combos', resource: 'ComboServico',
  createSchema: 'ComboServicoCreate', updateSchema: 'ComboServicoUpdate',
  security: { create: 'role', update: 'role', delete: 'role' },
  descriptions: { create: 'Somente a proprietária do combo pode associar um serviço.' },
});

addCrud({
  base: '/api/disponibilidade', tag: 'Disponibilidade', singular: 'horário disponível', plural: 'horários disponíveis', resource: 'Disponibilidade',
  createSchema: 'DisponibilidadeCreate', updateSchema: 'DisponibilidadeUpdate',
  security: { create: 'role', update: 'role', delete: 'role' },
  descriptions: {
    create: 'Exige perfil de diarista, propriedade do perfil e intervalo válido sem sobreposição.',
    update: 'Somente a diarista proprietária pode alterar o horário.',
    delete: 'Somente a diarista proprietária pode excluir o horário.',
  },
});

paths['/api/agendamento'] = {
  get: {
    tags: ['Agendamentos'],
    summary: 'Listar agendamentos',
    description: 'Retorna apenas agendamentos dos perfis do usuário autenticado, com filtros de status e visão.',
    operationId: 'listarAgendamentos',
    security: bearerSecurity,
    parameters: [
      ...paginationParameters,
      { name: 'status', in: 'query', schema: schemaRef('AgendamentoStatus') },
      { name: 'visao', in: 'query', schema: { type: 'string', enum: ['solicitacoes', 'futuros', 'historico', 'todos'], default: 'todos' } },
    ],
    responses: {
      '200': successResponse('Agendamentos retornados.', paginatedSchema('Agendamento')),
      ...standardErrors({ authenticated: true, forbidden: true }),
    },
  },
  post: {
    tags: ['Agendamentos'],
    summary: 'Criar agendamento',
    description: 'Cria uma solicitação com validade de 48 horas. O cliente, o preço e os serviços são validados pelo backend.',
    operationId: 'criarAgendamento',
    security: bearerSecurity,
    requestBody: requestBody('AgendamentoCreate'),
    responses: {
      '201': successResponse('Agendamento criado.', schemaRef('Agendamento')),
      ...standardErrors({ authenticated: true, forbidden: true, conflict: true }),
    },
  },
};

paths['/api/agendamento/estimativa'] = {
  post: {
    tags: ['Agendamentos'],
    summary: 'Calcular estimativa do agendamento',
    description: 'Valida diarista, endereço, disponibilidade, serviços e combo aplicável sem criar o agendamento.',
    operationId: 'estimarAgendamento',
    security: bearerSecurity,
    requestBody: requestBody('AgendamentoCreate'),
    responses: {
      '200': successResponse('Estimativa calculada.', schemaRef('AgendamentoEstimativa')),
      ...standardErrors({ authenticated: true, forbidden: true, notFound: true, conflict: true }),
    },
  },
};

paths['/api/agendamento/{id}'] = {
  get: {
    tags: ['Agendamentos'], summary: 'Buscar agendamento por ID', operationId: 'buscarAgendamentoPorId',
    description: 'Somente cliente ou diarista participante pode consultar.', parameters: [id], security: bearerSecurity,
    responses: { '200': successResponse('Agendamento encontrado.', schemaRef('Agendamento')), ...standardErrors({ authenticated: true, forbidden: true, notFound: true }) },
  },
  put: {
    tags: ['Agendamentos'], summary: 'Atualizar observações do agendamento', operationId: 'atualizarAgendamento',
    description: 'Altera somente observações enquanto o agendamento está pendente ou aceito.', parameters: [id], security: bearerSecurity,
    requestBody: requestBody('AgendamentoUpdate'),
    responses: { '200': successResponse('Agendamento atualizado.', schemaRef('Agendamento')), ...standardErrors({ authenticated: true, forbidden: true, notFound: true, conflict: true }) },
  },
  delete: {
    tags: ['Agendamentos'], summary: 'Excluir agendamento', operationId: 'excluirAgendamento',
    description: 'Exclusão conforme as regras de participação e estado implementadas no serviço.', parameters: [id], security: bearerSecurity,
    responses: { '204': successResponse('Agendamento excluído.'), ...standardErrors({ authenticated: true, forbidden: true, notFound: true, conflict: true }) },
  },
};

for (const action of [
  { path: 'aceitar', summary: 'Aceitar solicitação de agendamento', operationId: 'aceitarAgendamento', role: 'diarista', description: 'Somente a diarista destinatária pode aceitar uma solicitação pendente e não expirada.' },
  { path: 'recusar', summary: 'Recusar solicitação de agendamento', operationId: 'recusarAgendamento', role: 'diarista', description: 'Somente a diarista destinatária pode recusar uma solicitação pendente.' },
  { path: 'cancelar', summary: 'Cancelar agendamento', operationId: 'cancelarAgendamento', description: 'Cliente ou diarista participante pode cancelar um agendamento pendente ou aceito.', body: 'AgendamentoCancel' },
]) {
  paths[`/api/agendamento/{id}/${action.path}`] = {
    post: {
      tags: ['Agendamentos'], summary: action.summary, description: action.description, operationId: action.operationId,
      parameters: [id], security: bearerSecurity,
      ...(action.body ? { requestBody: requestBody(action.body) } : {}),
      responses: {
        '200': successResponse('Agendamento atualizado.', schemaRef('Agendamento')),
        ...standardErrors({ authenticated: true, forbidden: true, notFound: true, conflict: true }),
      },
    },
  };
}

addCrud({
  base: '/api/agendamento-servico', tag: 'Serviços do agendamento', singular: 'serviço do agendamento', plural: 'serviços do agendamento', resource: 'AgendamentoServico',
  paginated: true,
  security: { list: true, find: true },
  allow: { list: true, find: true, create: false, update: false, delete: false },
  descriptions: {
    list: 'Lista itens de serviço somente dos agendamentos em que o usuário é participante.',
    find: 'Consulta um item somente se o usuário participa do agendamento correspondente.',
  },
});

paths['/api/checkin-checkout/agendamento/{id}'] = {
  get: {
    tags: ['Check-in e check-out'], summary: 'Consultar check-in pelo agendamento', operationId: 'buscarCheckinPorAgendamento',
    description: 'Cliente ou diarista participante pode consultar. Retorna null se o fluxo ainda não foi iniciado.',
    parameters: [id], security: bearerSecurity,
    responses: { '200': successResponse('Estado do check-in.', { allOf: [schemaRef('CheckinCheckout')], nullable: true }), ...standardErrors({ authenticated: true, forbidden: true, notFound: true }) },
  },
};

for (const action of [
  { path: 'solicitar', summary: 'Solicitar check-in', operationId: 'solicitarCheckin', description: 'A diarista pode solicitar a partir de uma hora antes do serviço aceito.' },
  { path: 'confirmar-pagamento', summary: 'Confirmar pagamento e check-in', operationId: 'confirmarPagamento', description: 'O cliente confirma o pagamento e inicia o serviço.' },
  { path: 'checkout', summary: 'Realizar check-out', operationId: 'realizarCheckout', description: 'A diarista conclui um serviço iniciado e pago.' },
]) {
  paths[`/api/checkin-checkout/agendamento/{id}/${action.path}`] = {
    post: {
      tags: ['Check-in e check-out'], summary: action.summary, description: action.description, operationId: action.operationId,
      parameters: [id], security: bearerSecurity,
      responses: { '200': successResponse('Fluxo atualizado.', schemaRef('CheckinCheckout')), ...standardErrors({ authenticated: true, forbidden: true, notFound: true, conflict: true }) },
    },
  };
}

addCrud({
  base: '/api/avaliacao', tag: 'Avaliações', singular: 'avaliação', plural: 'avaliações', resource: 'Avaliacao',
  createSchema: 'AvaliacaoCreate', updateSchema: 'AvaliacaoUpdate', paginated: true,
  security: { create: true, update: true, delete: true },
  descriptions: {
    list: 'Lista avaliações públicas.',
    create: 'O autor é derivado do token. Só participantes podem avaliar após a conclusão, uma vez por lado.',
    update: 'Somente o autor pode atualizar a própria avaliação.',
    delete: 'Somente o autor pode excluir a própria avaliação.',
  },
});

addCrud({
  base: '/api/favorito', tag: 'Favoritos', singular: 'favorito', plural: 'favoritos', resource: 'Favorito',
  createSchema: 'FavoritoCreate', paginated: true,
  security: { list: 'role', find: 'role', create: 'role', delete: 'role' },
  allow: { list: true, find: true, create: true, update: false, delete: true },
  descriptions: {
    list: 'Lista favoritos do cliente autenticado.',
    create: 'O id_cliente é derivado do token; o corpo informa somente a diarista.',
    delete: 'Somente o cliente proprietário pode remover o favorito.',
  },
});

addCrud({
  base: '/api/denuncia', tag: 'Denúncias', singular: 'denúncia', plural: 'denúncias', resource: 'Denuncia',
  createSchema: 'DenunciaCreate', updateSchema: 'DenunciaUpdate', paginated: true,
  security: { list: true, find: true, create: true, update: true, delete: true },
  descriptions: {
    list: 'Lista somente denúncias criadas pelo usuário autenticado.',
    create: 'O denunciante é derivado do token e não pode denunciar a si próprio.',
  },
});

addCrud({
  base: '/api/ocorrencia', tag: 'Ocorrências', singular: 'ocorrência', plural: 'ocorrências', resource: 'Ocorrencia',
  createSchema: 'OcorrenciaCreate', updateSchema: 'OcorrenciaUpdate', paginated: true,
  security: { list: true, find: true, create: true, update: true, delete: true },
  descriptions: { list: 'Lista ocorrências dos agendamentos em que o usuário é participante.' },
});

const nullableString = (maxLength) => ({ type: 'string', nullable: true, maxLength });
const positiveInteger = { type: 'integer', minimum: 1 };
const money = { type: 'number', format: 'double', minimum: 0, exclusiveMinimum: true, maximum: 999999.99 };
const date = { type: 'string', format: 'date', example: '2026-08-15' };
const time = { type: 'string', pattern: '^([01]\\d|2[0-3]):[0-5]\\d(?::[0-5]\\d)?$', example: '09:00' };

function objectSchema(properties, required = [], extra = {}) {
  return { type: 'object', properties, ...(required.length ? { required } : {}), additionalProperties: false, ...extra };
}

function partialSchema(schema, excluded = []) {
  const { required: _required, ...partial } = schema;
  return {
    ...partial,
    minProperties: 1,
    properties: Object.fromEntries(Object.entries(schema.properties).filter(([name]) => !excluded.includes(name))),
  };
}

const components = {
  securitySchemes: {
    bearerAuth: {
      type: 'http',
      scheme: 'bearer',
      bearerFormat: 'JWT',
      description: 'Token retornado por POST /api/auth/login.',
    },
  },
  responses: {
    ValidationError: { description: 'Parâmetros ou corpo inválidos.', content: json(schemaRef('Error')) },
    Unauthorized: { description: 'Token ausente, inválido ou expirado.', content: json(schemaRef('Error')) },
    Forbidden: { description: 'Usuário autenticado sem permissão.', content: json(schemaRef('Error')) },
    NotFound: { description: 'Recurso não encontrado.', content: json(schemaRef('Error')) },
    Conflict: { description: 'Conflito com o estado atual ou com uma regra do domínio.', content: json(schemaRef('Error')) },
    InternalError: { description: 'Erro interno da API.', content: json(schemaRef('Error')) },
  },
  schemas: {},
};

const usuarioCreate = objectSchema({
  nome: { type: 'string', minLength: 3, maxLength: 100, example: 'Maria da Silva' },
  email: { type: 'string', format: 'email', maxLength: 100, example: 'maria@example.com' },
  senha: { type: 'string', format: 'password', minLength: 8, maxLength: 100, writeOnly: true },
  telefone: { type: 'string', minLength: 10, maxLength: 20, example: '11999999999' },
  foto_perfil: {
    oneOf: [
      { type: 'string', format: 'uri', maxLength: 255, example: 'https://example.com/foto.jpg' },
      { type: 'string', enum: [''] },
    ],
    default: '',
  },
  cpf: { type: 'string', nullable: true, pattern: '^\\d{11}$', example: '52998224725' },
  tipo: { type: 'string', enum: ['CLIENTE', 'DIARISTA'], default: 'CLIENTE' },
}, ['nome', 'email', 'senha', 'telefone']);

const enderecoCadastro = objectSchema({
  bairro: { type: 'string', minLength: 2, maxLength: 100 },
  cep: { type: 'string', pattern: '^\\d{5}-?\\d{3}$', example: '01001-000' },
  logradouro: { type: 'string', minLength: 2, maxLength: 150 },
  numero: { type: 'integer', minimum: 0 },
  complemento: nullableString(100),
  cidade: { type: 'string', minLength: 2, maxLength: 100 },
  estado: { type: 'string', minLength: 2, maxLength: 2, example: 'SP' },
  referencia: nullableString(150),
}, ['bairro', 'cep', 'logradouro', 'numero', 'cidade', 'estado']);

const clienteCreate = objectSchema({
  id_usuario: positiveInteger,
  data_nascimento: date,
  qtd_comodos: { type: 'integer', minimum: 1, maximum: 100 },
  tamanho_casa: { type: 'string', enum: ['pequena', 'media', 'grande'] },
  endereco: enderecoCadastro,
}, ['id_usuario', 'data_nascimento', 'qtd_comodos', 'tamanho_casa', 'endereco']);

const servicoCadastroDiarista = objectSchema({
  id_servico: positiveInteger,
  nome_servico: { type: 'string', minLength: 2, maxLength: 100 },
  descricao: nullableString(2000),
  preco: money,
  faz_parte_combo_base: { type: 'boolean', default: false },
}, ['preco'], {
  description: 'Informe exclusivamente id_servico para um item do catálogo ou nome_servico para criar um novo serviço.',
  oneOf: [
    { required: ['id_servico'], not: { required: ['nome_servico'] } },
    { required: ['nome_servico'], not: { required: ['id_servico'] } },
  ],
});

const comboBaseCadastro = objectSchema({
  nome_combo: { type: 'string', minLength: 2, maxLength: 100 },
  valor_base: money,
  descricao: nullableString(2000),
  qtd_comodos_casa: { type: 'integer', minimum: 1, maximum: 100 },
  atende_casa_pequena: { type: 'boolean', default: false },
  atende_casa_media: { type: 'boolean', default: false },
  atende_casa_grande: { type: 'boolean', default: false },
}, ['nome_combo', 'valor_base', 'qtd_comodos_casa']);

const diaristaCreate = objectSchema({
  id_usuario: positiveInteger,
  descricao: { type: 'string', minLength: 20, maxLength: 2000 },
  frequencia_resposta: nullableString(50),
  qtd_max_comodos: { type: 'integer', minimum: 1, maximum: 100 },
  endereco: enderecoCadastro,
  servicos: { type: 'array', minItems: 1, maxItems: 50, items: servicoCadastroDiarista },
  combo_base: comboBaseCadastro,
}, ['id_usuario', 'descricao', 'qtd_max_comodos', 'endereco']);

const enderecoCreate = objectSchema({
  id_cliente: positiveInteger,
  id_diarista: positiveInteger,
  ...enderecoCadastro.properties,
}, ['bairro', 'cep', 'logradouro', 'numero', 'cidade', 'estado'], {
  description: 'Informe exatamente um proprietário: id_cliente ou id_diarista.',
  oneOf: [
    { required: ['id_cliente'], not: { required: ['id_diarista'] } },
    { required: ['id_diarista'], not: { required: ['id_cliente'] } },
  ],
});
const { oneOf: _ownerRule, description: _ownerDescription, ...enderecoUpdateBase } = enderecoCreate;

const servicoCreate = objectSchema({
  nome_servico: { type: 'string', minLength: 2, maxLength: 100 },
  descricao: nullableString(2000),
}, ['nome_servico']);

const diaristaServicoCreate = objectSchema({
  id_diarista: positiveInteger,
  id_servico: positiveInteger,
  preco: money,
  faz_parte_combo_base: { type: 'boolean', nullable: true },
}, ['id_diarista', 'id_servico', 'preco']);

const comboBaseCreate = objectSchema({
  id_diarista: positiveInteger,
  nome_combo: { type: 'string', minLength: 2, maxLength: 100 },
  valor_base: money,
  descricao: nullableString(2000),
  qtd_comodos_casa: { type: 'integer', minimum: 1, maximum: 100 },
  atende_casa_pequena: { type: 'boolean', nullable: true },
  atende_casa_media: { type: 'boolean', nullable: true },
  atende_casa_grande: { type: 'boolean', nullable: true },
}, ['id_diarista', 'nome_combo', 'valor_base', 'qtd_comodos_casa']);

const comboServicoCreate = objectSchema({ id_servico: positiveInteger, id_combo_base: positiveInteger }, ['id_servico', 'id_combo_base']);

const disponibilidadeCreate = objectSchema({
  id_diarista: positiveInteger,
  dia_semana: date,
  horario_inicio: time,
  horario_fim: time,
  disponivel: { type: 'boolean', default: true },
}, ['id_diarista', 'dia_semana', 'horario_inicio', 'horario_fim']);

const agendamentoCreate = objectSchema({
  id_diarista: positiveInteger,
  id_endereco: positiveInteger,
  id_combo_base: positiveInteger,
  data_agendamento: date,
  horario_inicio: time,
  horario_fim: time,
  qtd_comodos: { type: 'integer', minimum: 1, maximum: 100 },
  tamanho_residencia: { type: 'string', enum: ['pequena', 'media', 'grande'] },
  observacoes: nullableString(2000),
  servicos: {
    type: 'array', minItems: 1, maxItems: 50,
    items: objectSchema({ id_diarista_servico: positiveInteger }, ['id_diarista_servico']),
  },
}, ['id_diarista', 'id_endereco', 'data_agendamento', 'horario_inicio', 'horario_fim', 'qtd_comodos', 'tamanho_residencia', 'servicos']);

const avaliacaoCreate = objectSchema({
  id_agendamento: positiveInteger,
  nota: { type: 'number', minimum: 0, maximum: 5, multipleOf: 0.1 },
  comentario: nullableString(2000),
  publica: { type: 'boolean', default: true },
  anonima: { type: 'boolean', default: false },
}, ['id_agendamento', 'nota']);

const denunciaCreate = objectSchema({
  id_usuario_denunciado: positiveInteger,
  motivo: { type: 'string', enum: ['spam', 'fraude', 'comportamento_inadequado', 'outro'] },
  descricao: nullableString(2000),
}, ['id_usuario_denunciado', 'motivo']);

const ocorrenciaCreate = objectSchema({
  id_agendamento: positiveInteger,
  motivo: { type: 'string', enum: ['cancelamento', 'atraso', 'problema', 'outro'] },
  descricao: nullableString(2000),
}, ['id_agendamento', 'motivo']);

components.schemas = {
  Health: objectSchema({ status: { type: 'string', enum: ['ok'] } }, ['status']),
  Error: {
    type: 'object',
    required: ['error'],
    properties: {
      error: { type: 'string', example: 'Dados inválidos' },
      details: { type: 'array', items: { type: 'object', additionalProperties: true } },
    },
  },
  Pagination: objectSchema({
    page: { type: 'integer', minimum: 1 }, limit: { type: 'integer', minimum: 1 },
    total: { type: 'integer', minimum: 0 }, pages: { type: 'integer', minimum: 0 },
  }, ['page', 'limit', 'total', 'pages']),
  LoginRequest: objectSchema({ email: { type: 'string', format: 'email', maxLength: 100 }, senha: { type: 'string', format: 'password', minLength: 1, maxLength: 100 } }, ['email', 'senha']),
  SelectProfileRequest: objectSchema({ profile: { type: 'string', enum: ['CLIENTE', 'DIARISTA'] } }, ['profile']),
  LoginResponse: objectSchema({ token: { type: 'string', description: 'JWT Bearer.' }, user: schemaRef('Usuario') }, ['token', 'user']),
  UsuarioCreate: usuarioCreate,
  UsuarioUpdate: partialSchema(usuarioCreate),
  Usuario: objectSchema({
    id_usuario: positiveInteger, nome: { type: 'string' }, email: { type: 'string', format: 'email' }, telefone: { type: 'string' }, cpf: { type: 'string', nullable: true },
    foto_perfil: { type: 'string' }, data_cadastro: { type: 'string', format: 'date-time' },
    cliente: { type: 'array', items: objectSchema({ id_cliente: positiveInteger }) },
    diarista: { type: 'array', items: objectSchema({ id_diarista: positiveInteger }) },
    profiles: { type: 'array', items: { type: 'string', enum: ['CLIENTE', 'DIARISTA'] } },
    activeProfile: { type: 'string', enum: ['CLIENTE', 'DIARISTA'], nullable: true },
    requiresProfileSelection: { type: 'boolean' },
  }, ['id_usuario', 'nome', 'email', 'telefone']),
  ClienteCreate: clienteCreate,
  ClienteUpdate: partialSchema(clienteCreate, ['id_usuario', 'endereco']),
  Cliente: objectSchema({
    id_cliente: positiveInteger,
    id_usuario: positiveInteger,
    data_nascimento: date,
    qtd_comodos: { type: 'integer', minimum: 1, maximum: 100 },
    tamanho_casa: { type: 'string', enum: ['pequena', 'media', 'grande'] },
    usuario: { type: 'object', additionalProperties: true },
    endereco: { type: 'array', items: schemaRef('Endereco') },
    _count: objectSchema({
      agendamento: { type: 'integer', minimum: 0 },
      favorito: { type: 'integer', minimum: 0 },
      avaliacao: { type: 'integer', minimum: 0 },
    }),
  }, ['id_cliente', 'id_usuario', 'data_nascimento', 'qtd_comodos', 'tamanho_casa'], { additionalProperties: true }),
  DiaristaCreate: diaristaCreate,
  DiaristaUpdate: partialSchema(diaristaCreate, ['id_usuario', 'endereco', 'servicos', 'combo_base']),
  Diarista: objectSchema({
    id_diarista: positiveInteger, ...diaristaCreate.properties, avaliacao_media: { type: 'number', nullable: true }, valor_medio_diaria: { type: 'number', nullable: true }, distancia_km: { type: 'number', minimum: 0, nullable: true },
  }, ['id_diarista', 'id_usuario', 'descricao', 'qtd_max_comodos'], { additionalProperties: true }),
  DiaristaEstatisticas: objectSchema({
    agendamentos_por_status: { type: 'object', additionalProperties: { type: 'integer', minimum: 0 } },
    diarias_concluidas: { type: 'integer', minimum: 0 }, avaliacao_media: { type: 'number', nullable: true },
    total_avaliacoes: { type: 'integer', minimum: 0 }, taxa_resposta: { type: 'number', nullable: true },
    tempo_medio_resposta_horas: { type: 'number', nullable: true },
  }, ['agendamentos_por_status', 'diarias_concluidas', 'avaliacao_media', 'total_avaliacoes', 'taxa_resposta', 'tempo_medio_resposta_horas']),
  EnderecoCreate: enderecoCreate,
  EnderecoUpdate: partialSchema(enderecoUpdateBase),
  Endereco: objectSchema({ id_endereco: positiveInteger, ...enderecoCreate.properties }, ['id_endereco', 'bairro', 'cep', 'logradouro', 'numero', 'cidade', 'estado'], { additionalProperties: true }),
  ServicoCreate: servicoCreate,
  ServicoUpdate: partialSchema(servicoCreate),
  Servico: objectSchema({ id_servico: positiveInteger, ...servicoCreate.properties }, ['id_servico', 'nome_servico'], { additionalProperties: true }),
  DiaristaServicoCreate: diaristaServicoCreate,
  DiaristaServicoUpdate: objectSchema({ preco: money, faz_parte_combo_base: { type: 'boolean', nullable: true } }, [], { minProperties: 1 }),
  DiaristaServico: objectSchema({ id_diarista_servico: positiveInteger, ...diaristaServicoCreate.properties }, ['id_diarista_servico', 'id_diarista', 'id_servico', 'preco'], { additionalProperties: true }),
  ComboBaseCreate: comboBaseCreate,
  ComboBaseUpdate: partialSchema(comboBaseCreate, ['id_diarista']),
  ComboBase: objectSchema({ id_combo_base: positiveInteger, ...comboBaseCreate.properties }, ['id_combo_base', 'id_diarista', 'nome_combo', 'valor_base', 'qtd_comodos_casa'], { additionalProperties: true }),
  ComboServicoCreate: comboServicoCreate,
  ComboServicoUpdate: partialSchema(comboServicoCreate),
  ComboServico: objectSchema({ id_combo_servico: positiveInteger, ...comboServicoCreate.properties }, ['id_combo_servico', 'id_servico', 'id_combo_base'], { additionalProperties: true }),
  DisponibilidadeCreate: disponibilidadeCreate,
  DisponibilidadeUpdate: partialSchema(disponibilidadeCreate, ['id_diarista']),
  Disponibilidade: objectSchema({ id_agenda: positiveInteger, ...disponibilidadeCreate.properties }, ['id_agenda', 'id_diarista', 'dia_semana', 'horario_inicio', 'disponivel'], { additionalProperties: true }),
  AgendamentoStatus: { type: 'string', enum: ['Aceito', 'Cancelado', 'Pendente', 'Recusado', 'Expirado', 'Em_andamento', 'Concluido'] },
  AgendamentoCreate: agendamentoCreate,
  AgendamentoUpdate: objectSchema({ observacoes: nullableString(2000) }, [], { minProperties: 1 }),
  AgendamentoCancel: objectSchema({ descricao: nullableString(2000) }),
  Agendamento: objectSchema({
    id_agendamento: positiveInteger, id_cliente: positiveInteger, id_diarista: positiveInteger, id_endereco: { ...positiveInteger, nullable: true }, id_combo_base: { ...positiveInteger, nullable: true },
    data_agendamento: date, horario_inicio: { ...time, nullable: true }, horario_fim: { ...time, nullable: true },
    qtd_comodos: { type: 'integer', nullable: true }, tamanho_residencia: { type: 'string', enum: ['pequena', 'media', 'grande'], nullable: true },
    valor_estimado: { type: 'number', nullable: true }, observacoes: nullableString(2000), status: schemaRef('AgendamentoStatus'),
    solicitado_em: { type: 'string', format: 'date-time' }, expira_em: { type: 'string', format: 'date-time', nullable: true },
    respondido_em: { type: 'string', format: 'date-time', nullable: true }, concluido_em: { type: 'string', format: 'date-time', nullable: true },
  }, ['id_agendamento', 'id_cliente', 'id_diarista', 'data_agendamento', 'status'], { additionalProperties: true }),
  AgendamentoEstimativa: objectSchema({
    valor_estimado: { type: 'number', minimum: 0 }, combo_aplicado: { type: 'integer', nullable: true }, expira_em_horas: { type: 'integer', enum: [48] },
  }, ['valor_estimado', 'combo_aplicado', 'expira_em_horas']),
  AgendamentoServico: objectSchema({
    id: positiveInteger, id_agendamento: positiveInteger, diarista_servico_id_diarista_servico: positiveInteger, preco: { type: 'number' },
  }, ['id', 'id_agendamento', 'diarista_servico_id_diarista_servico', 'preco'], { additionalProperties: true }),
  CheckinCheckout: objectSchema({
    id_check: positiveInteger, id_agendamento: positiveInteger, horario_checkin: { type: 'string', format: 'date-time', nullable: true },
    horario_checkout: { type: 'string', format: 'date-time', nullable: true },
    status_checkin: { type: 'string', enum: ['N_o_iniciado', 'Checkin_solicitado', 'Aguardando_pagamento', 'Iniciado', 'Checkout_solicitado', 'Finalizado'] },
    status_pagamento: { type: 'string', enum: ['Pendente', 'Pago', 'Falhou'] }, pagamento_em: { type: 'string', format: 'date-time', nullable: true },
  }, ['id_check', 'id_agendamento', 'status_checkin', 'status_pagamento']),
  AvaliacaoCreate: avaliacaoCreate,
  AvaliacaoUpdate: partialSchema(avaliacaoCreate, ['id_agendamento']),
  Avaliacao: objectSchema({
    id_avaliacao: positiveInteger, id_agendamento: positiveInteger, id_cliente: positiveInteger, id_diarista: positiveInteger,
    nota: { type: 'number', minimum: 0, maximum: 5 }, comentario: nullableString(2000), comentario_publico: { type: 'boolean', nullable: true },
    comentario_privado: { type: 'boolean', nullable: true }, autor_tipo: { type: 'string', enum: ['Cliente', 'Diarista'] },
    anonima: { type: 'boolean' }, data_avaliacao: { type: 'string', format: 'date-time' },
  }, ['id_avaliacao', 'id_agendamento', 'id_cliente', 'id_diarista', 'nota', 'autor_tipo', 'anonima'], { additionalProperties: true }),
  FavoritoCreate: objectSchema({ id_diarista: positiveInteger }, ['id_diarista']),
  Favorito: objectSchema({ id_favorito: positiveInteger, id_cliente: positiveInteger, id_diarista: positiveInteger }, ['id_favorito', 'id_cliente', 'id_diarista'], { additionalProperties: true }),
  DenunciaCreate: denunciaCreate,
  DenunciaUpdate: partialSchema(denunciaCreate, ['id_usuario_denunciado']),
  Denuncia: objectSchema({
    id_denuncia: positiveInteger, id_usuario_denunciante: positiveInteger, ...denunciaCreate.properties, data_denuncia: { type: 'string', format: 'date-time' },
  }, ['id_denuncia', 'id_usuario_denunciante', 'id_usuario_denunciado', 'motivo', 'data_denuncia'], { additionalProperties: true }),
  OcorrenciaCreate: ocorrenciaCreate,
  OcorrenciaUpdate: partialSchema(ocorrenciaCreate, ['id_agendamento']),
  Ocorrencia: objectSchema({
    id_ocorrencia: positiveInteger, ...ocorrenciaCreate.properties, data_ocorrencia: { type: 'string', format: 'date-time' },
  }, ['id_ocorrencia', 'id_agendamento', 'motivo', 'data_ocorrencia'], { additionalProperties: true }),
};

export const openApiDocument = {
  openapi: '3.0.3',
  info: {
    title: 'Diária Certa API',
    version: '1.0.0',
    description: 'Documentação dos endpoints efetivamente registrados pelo backend da plataforma Diária Certa.',
  },
  servers: [{ url: '/', description: 'Servidor atual' }],
  tags: [
    { name: 'Sistema', description: 'Saúde e contrato da API.' },
    { name: 'Autenticação', description: 'Login e sessão autenticada.' },
    { name: 'Usuários', description: 'Contas de acesso.' },
    { name: 'Clientes', description: 'Perfis de clientes.' },
    { name: 'Diaristas', description: 'Perfis, busca e estatísticas de diaristas.' },
    { name: 'Endereços', description: 'Endereços dos perfis.' },
    { name: 'Serviços', description: 'Catálogo geral de serviços.' },
    { name: 'Serviços da diarista', description: 'Serviços e preços oferecidos por diaristas.' },
    { name: 'Combos base', description: 'Combos configurados pelas diaristas.' },
    { name: 'Serviços dos combos', description: 'Associação entre combos e serviços.' },
    { name: 'Disponibilidade', description: 'Agenda de disponibilidade das diaristas.' },
    { name: 'Agendamentos', description: 'Solicitações, estimativa e ciclo do agendamento.' },
    { name: 'Serviços do agendamento', description: 'Itens de serviço registrados nos agendamentos.' },
    { name: 'Check-in e check-out', description: 'Execução, pagamento e conclusão da diária.' },
    { name: 'Avaliações', description: 'Avaliações após serviços concluídos.' },
    { name: 'Favoritos', description: 'Diaristas favoritas do cliente.' },
    { name: 'Denúncias', description: 'Denúncias entre usuários.' },
    { name: 'Ocorrências', description: 'Ocorrências ligadas a agendamentos.' },
  ],
  paths,
  components,
};

export default openApiDocument;

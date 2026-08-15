import { z } from 'zod';

const positiveId = z.coerce.number().int().positive();
const money = z.coerce.number().positive().max(999999.99);
const nullableText = (max) => z.string().trim().max(max).nullable().optional();
const dateOnly = z.string().regex(/^\d{4}-\d{2}-\d{2}$/).transform((value) => new Date(`${value}T00:00:00.000Z`));
const timeOnly = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d(?::[0-5]\d)?$/).transform((value) => new Date(`1970-01-01T${value.length === 5 ? `${value}:00` : value}.000Z`));

export const idSchema = z.object({ id: positiveId });

export const paginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
});

export const loginSchema = z.object({
  email: z.string().trim().email().max(100).transform((value) => value.toLowerCase()),
  senha: z.string().min(1).max(100),
});

export const selectProfileSchema = z.object({
  profile: z.enum(['CLIENTE', 'DIARISTA']),
});

function isValidCpf(value) {
  if (!value || /^(\d)\1{10}$/.test(value)) return false;
  const digit = (length) => {
    let sum = 0;
    for (let index = 0; index < length; index += 1) {
      sum += Number(value[index]) * (length + 1 - index);
    }
    const remainder = (sum * 10) % 11;
    return remainder === 10 ? 0 : remainder;
  };
  return digit(9) === Number(value[9]) && digit(10) === Number(value[10]);
}

const usuarioFields = {
  nome: z.string().trim().min(3).max(100),
  email: z.string().trim().email().max(100).transform((value) => value.toLowerCase()),
  senha: z.string().min(8).max(100),
  telefone: z.string().trim().min(10).max(20),
  foto_perfil: z.union([z.string().url().max(255), z.literal('')]).default(''),
  cpf: z.string().trim().regex(/^\d{11}$/).refine(isValidCpf, 'CPF inválido').nullable().optional(),
  tipo: z.enum(['CLIENTE', 'DIARISTA']).default('CLIENTE'),
};
export const createUsuarioSchema = z.object(usuarioFields);
export const updateUsuarioSchema = z.object(usuarioFields).omit({ tipo: true }).partial().refine((data) => Object.keys(data).length > 0, 'Informe ao menos um campo');

const enderecoCadastroFields = {
  bairro: z.string().trim().min(2).max(100),
  cep: z.string().trim().regex(/^\d{5}-?\d{3}$/).transform((value) => value.replace(/^(\d{5})(\d{3})$/, '$1-$2')),
  logradouro: z.string().trim().min(2).max(150),
  numero: z.coerce.number().int().nonnegative(),
  complemento: nullableText(100),
  cidade: z.string().trim().min(2).max(100),
  estado: z.string().trim().length(2).transform((value) => value.toUpperCase()),
  referencia: nullableText(150),
};
const enderecoCadastroSchema = z.object(enderecoCadastroFields);

const clienteFields = {
  id_usuario: positiveId,
  data_nascimento: dateOnly,
  qtd_comodos: z.coerce.number().int().positive().max(100),
  tamanho_casa: z.enum(['pequena', 'media', 'grande']),
};
export const createClienteSchema = z.object({ ...clienteFields, endereco: enderecoCadastroSchema });
export const updateClienteSchema = z.object(clienteFields).omit({ id_usuario: true }).partial().refine((data) => Object.keys(data).length > 0, 'Informe ao menos um campo');

const diaristaFields = {
  id_usuario: positiveId,
  descricao: z.string().trim().min(20).max(2000),
  frequencia_resposta: z.string().trim().max(50).nullable().optional(),
  qtd_max_comodos: z.coerce.number().int().positive().max(100),
};
export const createDiaristaSchema = z.object({ ...diaristaFields, endereco: enderecoCadastroSchema });
export const updateDiaristaSchema = z.object(diaristaFields).omit({ id_usuario: true }).partial().refine((data) => Object.keys(data).length > 0, 'Informe ao menos um campo');

const enderecoFields = {
  id_cliente: positiveId.optional(),
  id_diarista: positiveId.optional(),
  ...enderecoCadastroFields,
};
const exactlyOneOwner = (data) => Boolean(data.id_cliente) !== Boolean(data.id_diarista);
export const createEnderecoSchema = z.object(enderecoFields).refine(exactlyOneOwner, {
  message: 'O endereço deve pertencer a um cliente ou a uma diarista, exclusivamente',
});
export const updateEnderecoSchema = z.object(enderecoFields).partial().refine((data) => Object.keys(data).length > 0, 'Informe ao menos um campo');

export const createServicoSchema = z.object({
  nome_servico: z.string().trim().min(2).max(100),
  descricao: nullableText(2000),
});
export const updateServicoSchema = createServicoSchema.partial().refine((data) => Object.keys(data).length > 0, 'Informe ao menos um campo');

export const createDiaristaServicoSchema = z.object({
  id_diarista: positiveId,
  id_servico: positiveId,
  preco: money,
  faz_parte_combo_base: z.boolean().nullable().optional(),
});
export const updateDiaristaServicoSchema = z.object({
  preco: money.optional(),
  faz_parte_combo_base: z.boolean().nullable().optional(),
}).refine((data) => Object.keys(data).length > 0, 'Informe ao menos um campo');

const comboBaseFields = {
  id_diarista: positiveId,
  nome_combo: z.string().trim().min(2).max(100),
  valor_base: money,
  descricao: nullableText(2000),
  qtd_comodos_casa: z.coerce.number().int().positive().max(100),
  atende_casa_pequena: z.boolean().nullable().optional(),
  atende_casa_media: z.boolean().nullable().optional(),
  atende_casa_grande: z.boolean().nullable().optional(),
};
export const createComboBaseSchema = z.object(comboBaseFields);
export const updateComboBaseSchema = z.object(comboBaseFields).omit({ id_diarista: true }).partial().refine((data) => Object.keys(data).length > 0, 'Informe ao menos um campo');

export const createComboServicoSchema = z.object({ id_servico: positiveId, id_combo_base: positiveId });
export const updateComboServicoSchema = createComboServicoSchema.partial().refine((data) => Object.keys(data).length > 0, 'Informe ao menos um campo');

const availabilityFields = {
  id_diarista: positiveId,
  dia_semana: dateOnly,
  horario_inicio: timeOnly,
  horario_fim: timeOnly,
  disponivel: z.boolean().default(true),
};
const validTimeRange = (data) => !data.horario_inicio || !data.horario_fim || data.horario_fim > data.horario_inicio;
export const createDisponibilidadeSchema = z.object(availabilityFields).refine(validTimeRange, { message: 'O horário final deve ser posterior ao inicial' });
export const updateDisponibilidadeSchema = z.object(availabilityFields).omit({ id_diarista: true }).partial().refine(validTimeRange, { message: 'O horário final deve ser posterior ao inicial' });

export const createFavoritoSchema = z.object({ id_diarista: positiveId });

export const createDenunciaSchema = z.object({
  id_usuario_denunciado: positiveId,
  motivo: z.enum(['spam', 'fraude', 'comportamento_inadequado', 'outro']),
  descricao: nullableText(2000),
});
export const updateDenunciaSchema = z.object({
  motivo: z.enum(['spam', 'fraude', 'comportamento_inadequado', 'outro']).optional(),
  descricao: nullableText(2000),
}).refine((data) => Object.keys(data).length > 0, 'Informe ao menos um campo');

export const createOcorrenciaSchema = z.object({
  id_agendamento: positiveId,
  motivo: z.enum(['cancelamento', 'atraso', 'problema', 'outro']),
  descricao: nullableText(2000),
});
export const updateOcorrenciaSchema = createOcorrenciaSchema.omit({ id_agendamento: true }).partial().refine((data) => Object.keys(data).length > 0, 'Informe ao menos um campo');

export const createAgendamentoSchema = z.object({
  id_diarista: positiveId,
  id_endereco: positiveId,
  data_agendamento: dateOnly,
  horario_inicio: timeOnly,
  horario_fim: timeOnly,
  qtd_comodos: z.coerce.number().int().positive().max(100),
  tamanho_residencia: z.enum(['pequena', 'media', 'grande']),
  observacoes: nullableText(2000),
  servicos: z.array(z.object({ id_diarista_servico: positiveId })).min(1).max(50),
}).refine(validTimeRange, { message: 'O horário final deve ser posterior ao inicial' });
export const updateAgendamentoSchema = z.object({ observacoes: nullableText(2000) }).refine((data) => Object.keys(data).length > 0, 'Informe ao menos um campo');
export const cancelAgendamentoSchema = z.object({ descricao: nullableText(2000) });

export const createAgendamentoServicoSchema = z.object({
  id_agendamento: positiveId,
  diarista_servico_id_diarista_servico: positiveId,
  preco: money,
});
export const updateAgendamentoServicoSchema = z.object({ preco: money });

export const createAvaliacaoSchema = z.object({
  id_agendamento: positiveId,
  nota: z.coerce.number().min(0).max(5).multipleOf(0.1),
  comentario: nullableText(2000),
  publica: z.boolean().default(true),
  anonima: z.boolean().default(false),
});
export const updateAvaliacaoSchema = z.object({
  nota: z.coerce.number().min(0).max(5).multipleOf(0.1).optional(),
  comentario: nullableText(2000),
  publica: z.boolean().optional(),
  anonima: z.boolean().optional(),
}).refine((data) => Object.keys(data).length > 0, 'Informe ao menos um campo');

export const diaristaSearchSchema = paginationSchema.extend({
  nome: z.string().trim().max(100).optional(),
  bairro: z.string().trim().max(100).optional(),
  cidade: z.string().trim().max(100).optional(),
  estado: z.string().trim().length(2).transform((value) => value.toUpperCase()).optional(),
  avaliacao_min: z.coerce.number().min(0).max(5).optional(),
  preco_min: z.coerce.number().nonnegative().optional(),
  preco_max: z.coerce.number().nonnegative().optional(),
  id_servico: positiveId.optional(),
  ordenar: z.enum(['avaliacao', 'preco_asc', 'preco_desc', 'nome']).default('avaliacao'),
});

export const agendamentoQuerySchema = paginationSchema.extend({
  status: z.enum(['Aceito', 'Cancelado', 'Pendente', 'Recusado', 'Expirado', 'Em_andamento', 'Concluido']).optional(),
  visao: z.enum(['solicitacoes', 'futuros', 'historico', 'todos']).default('todos'),
});

export const listQuerySchema = paginationSchema;

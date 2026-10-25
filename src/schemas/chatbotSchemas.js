// POLLYANA | ETAPA 3 — Contratos Zod: começar em extractionSchema.
// Validação estrutural não substitui as regras de preço, disponibilidade e autorização.
import { z } from 'zod';

const positiveId = z.number().int().positive();
export const chatbotIdSchema = z.object({ id: z.string().uuid() });
export const createConversationSchema = z.object({ nova: z.boolean().default(false) }).strict();
export const listConversationsSchema = z.object({
  page: z.coerce.number().int().positive().max(100000).default(1),
  limit: z.coerce.number().int().positive().max(50).default(20),
}).strict();
export const chatbotMessageSchema = z.object({
  id_requisicao: z.string().uuid(),
  mensagem: z.string().trim().min(1).max(2000),
  selecao: z.object({
    id_endereco: positiveId.optional(),
    id_servico: positiveId.optional(),
    id_combo_base: positiveId.nullable().optional(),
  }).strict().refine((value) => Object.keys(value).length === 1, 'Escolha uma opção por vez').optional(),
}).strict();

// POLLYANA | ETAPA 3 — Destacar intenção, data, horário, serviços e esclarecimento.
// consulta_diarista contém nome e assunto; IDs de profissionais não são escolhidos livremente pela IA.
export const extractionSchema = z.object({
  intencao: z.enum(['buscar', 'alterar', 'duvida', 'confirmar', 'cancelar', 'outro']),
  data: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable(),
  dias_a_partir_de_hoje: z.number().int().min(0).max(365).nullable(),
  horario: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/).nullable(),
  servicos: z.array(positiveId).max(50).nullable(),
  servicos_nao_encontrados: z.array(z.string().max(100)).max(20),
  limpar_pedido: z.boolean(),
  pergunta_contextualizada: z.string().max(600).nullable(),
  consulta_diarista: z.object({
    nome: z.string().trim().min(1).max(100).nullable(),
    assunto: z.enum(['combos', 'servicos', 'perfil']),
  }).strict().nullable(),
  esclarecimento: z.string().max(300).nullable(),
}).strict();

export const groundedAnswerSchema = z.object({
  resposta: z.string().trim().min(1).max(2000),
  fontes: z.array(z.string().max(100)).max(3),
}).strict();

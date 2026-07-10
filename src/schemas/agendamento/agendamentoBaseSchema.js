import { z } from 'zod';

export const agendamentoBaseSchema = z.object({
    id_agendamento: z.number().int(),
    id_cliente: z.number().int(),
    id_diarista: z.number().int(),
    data_agendamento: z.string().datetime(),
    observacoes: z.string().optional(),
    status: z.enum(['pendente', 'confirmado', 'cancelado']),
})
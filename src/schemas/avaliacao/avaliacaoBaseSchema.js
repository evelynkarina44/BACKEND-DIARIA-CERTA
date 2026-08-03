import { z } from 'zod';

export const avaliacaoBaseSchema = z.object({
    id_avaliacao: z.number().int(),
    id_agendamento: z.number().int(),
    id_cliente: z.number().int(),
    id_diarista: z.number().int(),
    nota: z.number().min(0).max(5).multipleOf(0.1),
    comentario: z.string().nullable().optional(),
    comentario_publico: z.boolean().nullable().optional(),
    comentario_privado: z.boolean().nullable().optional(),
})
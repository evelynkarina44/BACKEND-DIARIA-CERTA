import { z } from 'zod';

export const servicoBaseSchema = z.object({
    id_servico: z.number().int().positive(),
    nome_servico: z.string().max(255),
    descricao: z.string().max(255).optional(),
})
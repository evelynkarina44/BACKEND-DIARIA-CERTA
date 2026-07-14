import { z } from 'zod';

export const avaliacaoIdSchema = z.object({
    id_avaliacao: z.coerce.number().int().positive({ message: 'ID da avaliação deve ser um número inteiro positivo' }),
})
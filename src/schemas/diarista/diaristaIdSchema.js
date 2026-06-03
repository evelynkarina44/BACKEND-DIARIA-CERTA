import { z } from 'zod';

export const diaristaIdSchema = z.object({
    id_diarista: z.coerce.number().int().positive({ message: 'ID do diarista deve ser um número inteiro positivo' }),
})
import { z } from 'zod';

export const checkinCheckoutIdSchema = z.object({
    id_check: z.coerce.number().int().positive({ message: 'ID do check-in/check-out deve ser um número inteiro positivo' }),
})
import { z } from 'zod';

export const comboBaseIdSchema = z.object({
    id_combo_base: z.coerce.number().int().positive({ message: 'ID do combo base deve ser um número inteiro positivo' }),
})
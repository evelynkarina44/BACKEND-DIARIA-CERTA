import { z } from 'zod';

export const disponibilidadeDiaristaIdSchema = z.object({
    id_agenda: z.coerce.number().int().positive({ message: 'ID da agenda deve ser um número inteiro positivo' }),
})
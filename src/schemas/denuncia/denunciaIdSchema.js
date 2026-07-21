import { z } from 'zod';

export const denunciaIdSchema = z.object({
    id_denuncia: z.coerce.number().int().positive({ message: 'ID da denúncia deve ser um número inteiro positivo' }),
})
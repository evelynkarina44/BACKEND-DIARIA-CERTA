import { z } from 'zod';

export const favoritoIdSchema = z.object({
    id_favorito: z.coerce.number().int().positive({ message: 'ID do favorito deve ser um número inteiro positivo' }),
})
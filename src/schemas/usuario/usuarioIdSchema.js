import { z } from 'zod';

export const usuarioIdSchema = z.object({
    id_usuario: z.coerce.number().int().positive({ message: 'ID do usuário deve ser um número inteiro positivo' }),
})
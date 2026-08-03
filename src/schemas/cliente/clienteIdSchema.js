import { z } from 'zod';

export const clienteIdSchema = z.object({
    id_cliente: z.coerce.number().int().positive({ message: 'ID do cliente deve ser um número inteiro positivo' }),
})
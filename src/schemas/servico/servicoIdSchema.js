import { z } from 'zod';

export const servicoIdSchema = z.object({
    id_servico: z.coerce.number().int().positive({ message: 'ID do serviço deve ser um número inteiro positivo' }),
})
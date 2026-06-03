import { z } from 'zod';

export const enderecoIdSchema = z.object({
    id_endereco: z.coerce.number().int().positive({ message: 'ID do endereço deve ser um número inteiro positivo' }),
})
import { z } from 'zod';

export const diaristaServicoIdSchema = z.object({
    id_diarista_servico: z.coerce.number().int().positive({ message: 'ID do diarista-serviço deve ser um número inteiro positivo' }),
})
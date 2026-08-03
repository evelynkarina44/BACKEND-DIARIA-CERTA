import { z } from 'zod';

export const agendamentoIdSchema = z.object({
    id_agendamento: z.coerce.number().int().positive({ message: 'ID do agendamento deve ser um número inteiro positivo' }),
})
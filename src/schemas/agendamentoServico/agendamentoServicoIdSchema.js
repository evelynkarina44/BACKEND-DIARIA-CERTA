import { z } from 'zod';

export const agendamentoServicoIdSchema = z.object({
    id: z.coerce.number().int().positive({ message: 'ID do agendamento serviço deve ser um número inteiro positivo' }),
})
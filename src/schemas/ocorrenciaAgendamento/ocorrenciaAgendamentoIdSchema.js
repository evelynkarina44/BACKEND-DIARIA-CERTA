import { z } from 'zod';

export const ocorrenciaAgendamentoIdSchema = z.object({
    id_ocorrencia: z.coerce.number().int().positive({ message: 'ID da ocorrência do agendamento deve ser um número inteiro positivo' }),
})
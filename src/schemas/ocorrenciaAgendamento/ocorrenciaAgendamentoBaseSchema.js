import { z } from 'zod';

export const ocorrenciaAgendamentoBaseSchema = z.object({
    id_ocorrencia: z.number().int().positive(),
    id_agendamento: z.number().int().positive(),
    motivo: z.string().max(255),
    descricao: z.string().max(255),
    data_ocorrencia: z.string().datetime(),
})
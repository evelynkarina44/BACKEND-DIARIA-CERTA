import { z } from 'zod';

export const agendamentoServicoBaseSchema = z.object({
    id: z.number().int(),
    id_agendamento: z.number().int(),
    diarista_servico_id_diarista_servico: z.number().int(),
})
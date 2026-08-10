import { z } from 'zod';

export const disponibilidadeDiaristaBaseSchema = z.object({
    id_agenda: z.number().int().positive(),
    id_diarista: z.number().int().positive(),
    dia_semana: z.date(),
    horario_inicio: z.date(),
    horario_fim: z.date().nullable().optional(),
    disponivel: z.boolean(),
})

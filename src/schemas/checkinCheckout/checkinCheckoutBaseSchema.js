import { z } from 'zod';

export const checkinCheckoutBaseSchema = z.object({
    id_check: z.number().int().positive(),
    id_agendamento: z.number().int().positive(),
    horario_checkin: z.dateTime(),
    horario_checkout: z.dateTime(),
    status_checkin: z.enum(['NAO INICIADO', 'INICIADO', 'CANCELADO']),
})
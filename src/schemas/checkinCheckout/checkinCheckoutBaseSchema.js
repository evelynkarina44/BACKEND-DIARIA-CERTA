import { z } from 'zod';

export const checkinCheckoutBaseSchema = z.object({
    id_check: z.number().int().positive(),
    id_agendamento: z.number().int().positive(),
    horario_checkin: z.date().nullable(),
    horario_checkout: z.date().nullable(),
    status_checkin: z.enum(['N_o_iniciado', 'Checkin_solicitado', 'Aguardando_pagamento', 'Iniciado', 'Checkout_solicitado', 'Finalizado']),
    status_pagamento: z.enum(['Pendente', 'Pago', 'Falhou']),
})

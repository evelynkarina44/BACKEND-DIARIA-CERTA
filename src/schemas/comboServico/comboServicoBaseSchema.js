import { z } from 'zod';

export const comboServicoBaseSchema = z.object({
    id_combo_servico: z.number().int().positive(),
    id_servico: z.number().int().positive(),
    id_combo_base: z.number().int().positive(),
})
import { z } from 'zod';

export const diaristaServicoBaseSchema = z.object({
    id_diarista_servico: z.number().int().positive(),
    id_diarista: z.number().int().positive(),
    id_servico: z.number().int().positive(),
    preco: z.number().positive(),  
    faz_parte_combo_base: z.boolean(),
})
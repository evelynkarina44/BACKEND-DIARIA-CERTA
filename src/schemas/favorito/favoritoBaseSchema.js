import { z } from 'zod';

export const favoritoBaseSchema = z.object({
    id_favorito: z.number().int().positive(),
    id_cliente: z.number().int().positive(),
    id_diarista: z.number().int().positive(),
})
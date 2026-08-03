import { z } from 'zod';

export const denunciaBaseSchema = z.object({
    id_denuncia: z.number().int().positive(),
    id_usuario_denunciante: z.number().int().positive(),
    id_usuario_denunciado: z.number().int().positive(),
    motivo: z.string().min(5, { message: 'Motivo deve ter pelo menos 5 caracteres' }).max(100, { message: 'Motivo deve ter no máximo 100 caracteres' }),
    descricao: z.string().min(10, { message: 'Descrição deve ter pelo menos 10 caracteres' }).max(200, { message: 'Descrição deve ter no máximo 200 caracteres' }),
    data_denuncia: z.date(),
});
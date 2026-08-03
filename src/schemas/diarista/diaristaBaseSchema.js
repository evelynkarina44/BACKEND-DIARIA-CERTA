import { z } from 'zod';

export const diaristaBaseSchema = z.object({
    id_diarista: z.number().int(),
    id_usuario: z.number().int(),
    descricao: z.string(),
    frequencia_resposta: z.string().max(50, { message: "A frequência de resposta deve ter no máximo 50 caracteres." }).optional(),
    qtd_max_comodos: z.number().int(),
    avaliacao_media: z.number().refine(
        (val) => {
            if (!Number.isFinite(val)) return false;

            const regex = /^-?\d{1}\.\d{2}$/;
            const hasValidFormat = regex.test(val.toFixed(2));
            const isUnderRange = val >= 0.0 && val <= 5.0;
            return hasValidFormat && isUnderRange;
        },
        {
            message: "A avaliação média deve ser um número decimal com até 2 casas decimais, no formato X.XX, e estar entre 0.0 e 5.0.",
        }
    ),
})
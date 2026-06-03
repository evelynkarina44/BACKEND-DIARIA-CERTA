import { z } from 'zod';

export const comboBaseSchema = z.object({
    id_combo_base: z.number().int().positive(),
    id_diarista: z.number().int().positive(),
    nome_combo: z.string().min(2, { message: 'Nome do combo deve ter pelo menos 2 caracteres' }).max(100, { message: 'Nome do combo deve ter no máximo 100 caracteres' }),
    valor_base: z.number().decimal(8, 2).positive(),
    descricao: z.string().max(200, { message: 'Descrição do combo deve ter no máximo 200 caracteres' }),
    qtd_comodos_casa: z.number().int().positive({ message: 'Quantidade de cômodos deve ser um número inteiro positivo' }),
    atende_casa_pequena: z.boolean(),
    atende_casa_media: z.boolean(),
    atende_casa_grande: z.boolean(),
})
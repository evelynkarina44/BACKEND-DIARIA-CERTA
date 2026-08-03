import { z } from 'zod';

export const clienteBaseSchema = z.object({
    id_cliente: z.number().int(),
    id_usuario: z.number().int(),
    data_nascimento: z.string().refine((date) => {
        const parsedDate = Date.parse(date);
        return !isNaN(parsedDate);
    }, { message: 'Data de nascimento deve ser uma data válida' }),
    qtd_comodos: z.number().int().positive({ message: 'Quantidade de cômodos deve ser um número inteiro positivo' }),
    tamanho_casa: z.enum(['pequena', 'media', 'grande'], { message: 'Tamanho da casa deve ser "pequena", "media" ou "grande"' }),
})
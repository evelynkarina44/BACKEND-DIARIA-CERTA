import { z } from 'zod';

export const enderecoBaseSchema = z.object({
    id_endereco: z.number().int().positive(),
    id_cliente: z.number().int().positive(),
    id_diarista: z.number().int().positive(),
    bairro: z.string().min(2, { message: 'Bairro deve ter pelo menos 2 caracteres' }).max(100, { message: 'Bairro deve ter no máximo 100 caracteres' }),
    cep: z.string().regex(/^\d{5}-\d{3}$/, { message: 'CEP deve estar no formato XXXXX-XXX' }),
    logradouro: z.string().min(2, { message: 'Logradouro deve ter pelo menos 2 caracteres' }).max(150, { message: 'Logradouro deve ter no máximo 150 caracteres' }),
    numero: z.string().min(1, { message: 'Número deve ter pelo menos 1 caractere' }),
    complemento: z.string().max(100, { message: 'Complemento deve ter no máximo 100 caracteres' }),
    cidade: z.string().min(2, { message: 'Cidade deve ter pelo menos 2 caracteres' }).max(100, { message: 'Cidade deve ter no máximo 100 caracteres' }),
    estado: z.string().min(2, { message: 'UF deve ter pelo menos 2 caracteres' }).max(2, { message: 'UF deve ter no máximo 2 caracteres' }),
    referencia: z.string().max(150, { message: 'Referência deve ter no máximo 150 caracteres' }),
})
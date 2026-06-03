import { z } from 'zod';

export const usuarioBaseSchema = z.object({
    id_usuario: z.number().int(),
    nome: z.string().min(3, { message: 'Nome deve ter pelo menos 3 caracteres' }).max(100, { message: 'Nome deve ter no máximo 100 caracteres' }),
    email: z.string().email({ message: 'Email deve ser um email válido' }),
    senha: z.string().min(6, { message: 'Senha deve ter pelo menos 6 caracteres' }).max(100, { message: 'Senha deve ter no máximo 100 caracteres' }),
    telefone: z.string().min(10, { message: 'Telefone deve ter pelo menos 10 caracteres' }).max(20, { message: 'Telefone deve ter no máximo 20 caracteres' }),
    foto_perfil: z.string(),
    data_cadastro: z.date(),
})
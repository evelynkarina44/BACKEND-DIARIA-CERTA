import { z } from 'zod';
import { usuarioBaseSchema } from './usuarioBaseSchema';

export const createUsuarioSchema = usuarioBaseSchema.omit({
    id_usuario: true,
    data_cadastro: true,
});
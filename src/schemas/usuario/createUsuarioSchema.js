import { z } from 'zod';
import { usuarioBaseSchema } from './usuarioBaseSchema.js';

export const createUsuarioSchema = usuarioBaseSchema.omit({
    id_usuario: true,
    data_cadastro: true,
});
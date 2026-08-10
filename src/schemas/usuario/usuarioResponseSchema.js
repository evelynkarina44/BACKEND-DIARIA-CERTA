import { z } from 'zod';
import { usuarioBaseSchema } from './usuarioBaseSchema.js';

export const usuarioResponseSchema = usuarioBaseSchema.omit({
    senha: true,
})
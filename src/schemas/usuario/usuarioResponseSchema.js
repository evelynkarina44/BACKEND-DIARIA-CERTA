import { z } from 'zod';
import { usuarioBaseSchema } from './usuarioBaseSchema';

export const usuarioResponseSchema = usuarioBaseSchema.omit({
    senha: true,
})
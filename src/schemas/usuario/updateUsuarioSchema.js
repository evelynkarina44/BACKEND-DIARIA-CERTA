import { z } from 'zod';
import { createUsuarioSchema } from './createUsuarioSchema';

export const updateUsuarioSchema = createUsuarioSchema.partial();


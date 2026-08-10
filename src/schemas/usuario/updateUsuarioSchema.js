import { z } from 'zod';
import { createUsuarioSchema } from './createUsuarioSchema.js';

export const updateUsuarioSchema = createUsuarioSchema.partial();


import { z } from 'zod';
import { createServicoSchema } from './createServicoSchema.js';

export const updateServicoSchema = createServicoSchema.partial();
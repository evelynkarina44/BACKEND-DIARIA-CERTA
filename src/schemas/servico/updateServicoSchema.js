import { z } from 'zod';
import { createServicoSchema } from './createServicoSchema';

export const updateServicoSchema = createServicoSchema.partial();
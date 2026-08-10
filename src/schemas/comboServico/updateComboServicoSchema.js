import { z } from 'zod';
import { createComboServicoSchema } from './createComboServicoSchema.js';

export const updateComboServicoSchema = createComboServicoSchema.partial();
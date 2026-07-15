import { z } from 'zod';
import { createComboServicoSchema } from './createComboServicoSchema';

export const updateComboServicoSchema = createComboServicoSchema.partial();
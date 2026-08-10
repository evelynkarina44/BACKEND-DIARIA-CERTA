import { z } from 'zod';
import { createComboBaseSchema } from './createComboBaseSchema.js';

export const updateComboBaseSchema = createComboBaseSchema.partial();
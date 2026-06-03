import { z } from 'zod';
import { createComboBaseSchema } from './createComboBaseSchema';

export const updateComboBaseSchema = createComboBaseSchema.partial();
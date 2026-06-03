import { z } from 'zod';
import { createDiaristaSchema } from './createDiaristaSchema';

export const updateDiaristaSchema = createDiaristaSchema.partial();


import { z } from 'zod';
import { createDiaristaSchema } from './createDiaristaSchema.js';

export const updateDiaristaSchema = createDiaristaSchema.partial();


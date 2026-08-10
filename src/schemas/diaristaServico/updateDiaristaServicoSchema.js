import { z } from 'zod';
import { createDiaristaServicoSchema } from './createDiaristaServicoSchema.js';

export const updateDiaristaServicoSchema = createDiaristaServicoSchema.partial();


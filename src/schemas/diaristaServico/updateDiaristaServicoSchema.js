import { z } from 'zod';
import { createDiaristaServicoSchema } from './createDiaristaServicoSchema';

export const updateDiaristaServicoSchema = createDiaristaServicoSchema.partial();


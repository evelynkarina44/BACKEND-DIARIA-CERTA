import { z } from 'zod';
import { createDenunciaSchema } from './createDenunciaSchema.js';

export const updateDenunciaSchema = createDenunciaSchema.partial();


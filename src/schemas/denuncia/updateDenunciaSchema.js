import { z } from 'zod';
import { createDenunciaSchema } from './createDenunciaSchema';

export const updateDenunciaSchema = createDenunciaSchema.partial();


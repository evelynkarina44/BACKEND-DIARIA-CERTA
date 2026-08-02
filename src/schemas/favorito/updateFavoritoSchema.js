import { z } from 'zod';
import { createFavoritoSchema } from './createFavoritoSchema';

export const updateFavoritoSchema = createFavoritoSchema.partial();
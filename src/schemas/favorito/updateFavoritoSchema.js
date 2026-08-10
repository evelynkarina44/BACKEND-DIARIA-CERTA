import { z } from 'zod';
import { createFavoritoSchema } from './createFavoritoSchema.js';

export const updateFavoritoSchema = createFavoritoSchema.partial();
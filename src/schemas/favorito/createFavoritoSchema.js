import { z } from 'zod';
import { favoritoBaseSchema } from './favoritoBaseSchema.js';

export const createFavoritoSchema = favoritoBaseSchema.omit({
    id_favorito: true,
});
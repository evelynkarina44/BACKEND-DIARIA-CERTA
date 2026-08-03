import { z } from 'zod';
import { favoritoBaseSchema } from './favoritoBaseSchema';

export const createFavoritoSchema = favoritoBaseSchema.omit({
    id_favorito: true,
});
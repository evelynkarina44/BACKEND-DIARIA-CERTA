import { z } from 'zod';
import { diaristaBaseSchema } from './diaristaBaseSchema';

export const creatediaristaSchema = diaristaBaseSchema.omit({
    id_diarista: true,
});
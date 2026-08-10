import { z } from 'zod';
import { diaristaBaseSchema } from './diaristaBaseSchema.js';

export const createDiaristaSchema = diaristaBaseSchema.omit({
    id_diarista: true,
});

import { z } from 'zod';
import { avaliacaoBaseSchema } from './avaliacaoBaseSchema.js';

export const createAvaliacaoSchema = avaliacaoBaseSchema.omit({
    id_avaliacao: true,
});
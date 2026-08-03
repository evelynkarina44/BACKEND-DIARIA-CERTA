import { z } from 'zod';
import { avaliacaoBaseSchema } from './avaliacaoBaseSchema';

export const createAvaliacaoSchema = avaliacaoBaseSchema.omit({
    id_avaliacao: true,
});
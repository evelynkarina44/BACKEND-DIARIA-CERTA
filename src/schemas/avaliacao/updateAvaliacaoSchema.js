import { z } from 'zod';
import { createAvaliacaoSchema } from './createAvaliacaoSchema';

export const updateAvaliacaoSchema = createAvaliacaoSchema.partial();
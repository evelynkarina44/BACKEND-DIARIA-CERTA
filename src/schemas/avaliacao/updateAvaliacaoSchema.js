import { z } from 'zod';
import { createAvaliacaoSchema } from './createAvaliacaoSchema.js';

export const updateAvaliacaoSchema = createAvaliacaoSchema.partial();
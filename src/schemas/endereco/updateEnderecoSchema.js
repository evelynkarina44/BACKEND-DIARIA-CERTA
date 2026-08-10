import { z } from 'zod';
import { createEnderecoSchema } from './createEnderecoSchema.js';

export const updateEnderecoSchema = createEnderecoSchema.partial();


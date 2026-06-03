import { z } from 'zod';
import { createEnderecoSchema } from './createEnderecoSchema';

export const updateEnderecoSchema = createEnderecoSchema.partial();


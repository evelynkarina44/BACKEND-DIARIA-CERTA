import { z } from 'zod';
import { createClienteSchema } from './createClienteSchema.js';

export const updateClienteSchema = createClienteSchema.partial();


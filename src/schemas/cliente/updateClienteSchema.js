import { z } from 'zod';
import { createClienteSchema } from './createClienteSchema';

export const updateClienteSchema = createClienteSchema.partial();


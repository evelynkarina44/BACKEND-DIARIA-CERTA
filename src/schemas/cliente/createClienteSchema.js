import { z } from 'zod';
import { clienteBaseSchema } from './clienteBaseSchema.js';

export const createClienteSchema = clienteBaseSchema.omit({
    id_cliente: true,
});
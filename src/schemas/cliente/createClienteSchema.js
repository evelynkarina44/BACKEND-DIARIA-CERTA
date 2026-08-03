import { z } from 'zod';
import { clienteBaseSchema } from './clienteBaseSchema';

export const createClienteSchema = clienteBaseSchema.omit({
    id_cliente: true,
});
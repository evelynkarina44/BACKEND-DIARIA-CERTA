import { z } from 'zod';
import { enderecoBaseSchema } from './enderecoBaseSchema';

export const createEnderecoSchema = enderecoBaseSchema.omit({
    id_endereco: true,
});
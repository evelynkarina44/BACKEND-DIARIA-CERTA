import { z } from 'zod';
import { enderecoBaseSchema } from './enderecoBaseSchema.js';

export const createEnderecoSchema = enderecoBaseSchema.omit({
    id_endereco: true,
});
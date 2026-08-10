import { z } from 'zod';
import { servicoBaseSchema } from './servicoBaseSchema.js';

export const createServicoSchema = servicoBaseSchema.omit({
    id_servico: true,
});
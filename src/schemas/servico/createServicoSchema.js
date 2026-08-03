import { z } from 'zod';
import { servicoBaseSchema } from './servicoBaseSchema';

export const createServicoSchema = servicoBaseSchema.omit({
    id_servico: true,
});
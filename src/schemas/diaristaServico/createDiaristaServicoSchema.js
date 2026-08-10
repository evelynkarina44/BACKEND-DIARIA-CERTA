import { z } from 'zod';
import { diaristaServicoBaseSchema } from './diaristaServicoBaseSchema.js';

export const createDiaristaServicoSchema = diaristaServicoBaseSchema.omit({
    id_diarista_servico: true,
});
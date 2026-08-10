import { z } from 'zod';
import { denunciaBaseSchema } from './denunciaBaseSchema.js';

export const createDenunciaSchema = denunciaBaseSchema.omit({
    id_denuncia: true,
});
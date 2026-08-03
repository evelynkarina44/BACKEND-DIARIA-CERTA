import { z } from 'zod';
import { denunciaBaseSchema } from './denunciaBaseSchema';

export const createDenunciaSchema = denunciaBaseSchema.omit({
    id_denuncia: true,
});
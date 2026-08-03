import { z } from 'zod';
import { disponibilidadeDiaristaBaseSchema } from './disponibilidadeDiaristaBaseSchema';

export const createDisponibilidadeDiaristaSchema = disponibilidadeDiaristaBaseSchema.omit({
    id_agenda: true,
});
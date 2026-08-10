import { z } from 'zod';
import { disponibilidadeDiaristaBaseSchema } from './disponibilidadeDiaristaBaseSchema.js';

export const createDisponibilidadeDiaristaSchema = disponibilidadeDiaristaBaseSchema.omit({
    id_agenda: true,
});
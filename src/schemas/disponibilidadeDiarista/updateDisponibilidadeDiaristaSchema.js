import { z } from 'zod';
import { createDisponibilidadeDiaristaSchema } from './createDisponibilidadeDiaristaSchema';

export const updateDisponibilidadeDiaristaSchema = createDisponibilidadeDiaristaSchema.partial();
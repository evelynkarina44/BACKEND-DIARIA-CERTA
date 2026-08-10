import { z } from 'zod';
import { createDisponibilidadeDiaristaSchema } from './createDisponibilidadeDiaristaSchema.js';

export const updateDisponibilidadeDiaristaSchema = createDisponibilidadeDiaristaSchema.partial();
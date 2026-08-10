import { z } from 'zod';
import { createAgendamentoSchema } from './createAgendamentoSchema.js';

export const updateAgendamentoSchema = createAgendamentoSchema.partial();
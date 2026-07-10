import { z } from 'zod';
import { createAgendamentoSchema } from './createAgendamentoSchema';

export const updateAgendamentoSchema = createAgendamentoSchema.partial();
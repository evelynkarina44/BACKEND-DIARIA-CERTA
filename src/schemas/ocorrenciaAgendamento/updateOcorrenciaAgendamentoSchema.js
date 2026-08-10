import { z } from 'zod';
import { createOcorrenciaAgendamentoSchema } from './createOcorrenciaAgendamentoSchema.js';

export const updateOcorrenciaAgendamentoSchema = createOcorrenciaAgendamentoSchema.partial();
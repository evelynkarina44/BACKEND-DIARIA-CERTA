import { z } from 'zod';
import { createOcorrenciaAgendamentoSchema } from './createOcorrenciaAgendamentoSchema';

export const updateOcorrenciaAgendamentoSchema = createOcorrenciaAgendamentoSchema.partial();
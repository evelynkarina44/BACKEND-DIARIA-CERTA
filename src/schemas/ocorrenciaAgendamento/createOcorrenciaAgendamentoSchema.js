import { z } from 'zod';
import { ocorrenciaAgendamentoBaseSchema } from './ocorrenciaAgendamentoBaseSchema.js';

export const createOcorrenciaAgendamentoSchema = ocorrenciaAgendamentoBaseSchema.omit({
    id_ocorrencia: true,
});
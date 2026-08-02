import { z } from 'zod';
import { ocorrenciaAgendamentoBaseSchema } from './ocorrenciaAgendamentoBaseSchema';

export const createOcorrenciaAgendamentoSchema = ocorrenciaAgendamentoBaseSchema.omit({
    id_ocorrencia: true,
});
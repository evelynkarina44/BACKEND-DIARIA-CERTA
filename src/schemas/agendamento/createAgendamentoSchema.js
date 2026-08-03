import { z } from 'zod';
import { agendamentoBaseSchema } from './agendamentoBaseSchema';

export const createAgendamentoSchema = agendamentoBaseSchema.omit({
    id_agendamento: true,
});
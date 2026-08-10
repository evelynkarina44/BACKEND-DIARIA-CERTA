import { z } from 'zod';
import { agendamentoBaseSchema } from './agendamentoBaseSchema.js';

export const createAgendamentoSchema = agendamentoBaseSchema.omit({
    id_agendamento: true,
});
import { z } from 'zod';
import { agendamentoServicoBaseSchema } from './agendamentoServicoBaseSchema.js';

export const createAgendamentoServicoSchema = agendamentoServicoBaseSchema.omit({
    id: true,
});
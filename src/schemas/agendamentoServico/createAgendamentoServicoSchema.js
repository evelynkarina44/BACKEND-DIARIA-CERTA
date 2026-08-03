import { z } from 'zod';
import { agendamentoServicoBaseSchema } from './agendamentoServicoBaseSchema';

export const createAgendamentoServicoSchema = agendamentoServicoBaseSchema.omit({
    id: true,
});
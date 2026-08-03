import { z } from 'zod';
import { createAgendamentoServicoSchema } from './createAgendamentoServicoSchema';

export const updateAgendamentoServicoSchema = createAgendamentoServicoSchema.partial();
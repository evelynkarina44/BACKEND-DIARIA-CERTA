import { z } from 'zod';
import { createAgendamentoServicoSchema } from './createAgendamentoServicoSchema.js';

export const updateAgendamentoServicoSchema = createAgendamentoServicoSchema.partial();
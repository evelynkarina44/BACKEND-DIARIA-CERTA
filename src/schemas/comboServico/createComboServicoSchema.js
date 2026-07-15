import { z } from 'zod';
import { comboServicoSchema } from './comboServicoSchema';

export const createComboServicoSchema = comboServicoSchema.omit({
    id_combo_servico: true,
});
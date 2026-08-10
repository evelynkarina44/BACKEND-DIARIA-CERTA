import { z } from 'zod';
import { comboServicoBaseSchema } from './comboServicoBaseSchema.js';

export const createComboServicoSchema = comboServicoBaseSchema.omit({
    id_combo_servico: true,
});

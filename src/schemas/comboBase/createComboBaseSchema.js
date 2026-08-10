import { z } from 'zod';
import { comboBaseSchema } from './comboBaseSchema.js';

export const createComboBaseSchema = comboBaseSchema.omit({
    id_combo_base: true,
});
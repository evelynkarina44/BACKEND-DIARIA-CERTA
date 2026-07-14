import { z } from 'zod';
import { cheBaseSchema } from './usuarioBaseSchema';

export const createCheckinCheckoutSchema = checkinCheckoutBaseSchema.omit({
    id_check: true,
    horario_checkin: true,
    horario_checkout: true,
});
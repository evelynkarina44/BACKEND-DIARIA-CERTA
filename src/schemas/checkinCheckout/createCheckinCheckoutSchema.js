import { z } from 'zod';
import { checkinCheckoutBaseSchema } from './checkinCheckoutBaseSchema.js';

export const createCheckinCheckoutSchema = checkinCheckoutBaseSchema.omit({
    id_check: true,
    horario_checkin: true,
    horario_checkout: true,
});

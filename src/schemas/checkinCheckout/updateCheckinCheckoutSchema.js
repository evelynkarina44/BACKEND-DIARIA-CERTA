import { z } from 'zod';
import { createCheckinCheckoutSchema } from './createCheckinCheckoutSchema';

export const updateCheckinCheckoutSchema = createCheckinCheckoutSchema.partial();
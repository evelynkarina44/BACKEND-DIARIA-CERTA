import { z } from 'zod';
import { createCheckinCheckoutSchema } from './createCheckinCheckoutSchema.js';

export const updateCheckinCheckoutSchema = createCheckinCheckoutSchema.partial();
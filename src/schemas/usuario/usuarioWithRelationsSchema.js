import { z } from 'zod';
import { usuarioBaseSchema } from './usuarioBaseSchema.js';
import { clienteBaseSchema } from '../cliente/clienteBaseSchema.js';
import { diaristaBaseSchema } from '../diarista/diaristaBaseSchema.js';

export const usuarioWithRelationsSchema = usuarioBaseSchema.extend({
    cliente: z.array(clienteBaseSchema.omit({
        id_usuario: true,
    })),
    diarista: z.array(diaristaBaseSchema.omit({
        id_usuario: true,
    })),
})
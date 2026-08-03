import { z } from 'zod';
import { usuarioBaseSchema } from './usuarioBaseSchema';
import { clienteBaseSchema } from '../cliente/clienteBaseSchema';
import { diaristaBaseSchema } from '../diarista/diaristaBaseSchema';

export const usuarioWithRelationsSchema = usuarioBaseSchema.extend({
    cliente: z.array(clienteBaseSchema.omit({
        id_usuario: true,
    })),
    diarista: z.array(diaristaBaseSchema.omit({
        id_usuario: true,
    })),
})
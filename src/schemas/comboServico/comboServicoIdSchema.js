import { z } from 'zod';

export const comboServicoIdSchema = z.object({
    id_combo_servico: z.coerce.number().int().positive({ message: 'ID do combo serviço deve ser um número inteiro positivo' }),
})
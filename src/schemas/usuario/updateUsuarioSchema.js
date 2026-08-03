import { z } from "zod";

export const updateUsuarioSchema = z.object({
  body: z.object({
    nome: z.string().trim().min(3).max(100).optional(),
    telefone: z.string().trim().min(10).max(20).optional(),
    foto_perfil: z.string().trim().url().max(255).nullable().optional(),
  }).strict().refine((data) => Object.keys(data).length > 0, "Informe ao menos um campo."),
});

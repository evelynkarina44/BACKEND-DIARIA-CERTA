import { z } from "zod";

export const searchDiaristasSchema = z.object({
  query: z.object({
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(50).default(10),
    nome: z.string().trim().min(2).max(100).optional(),
    cidade: z.string().trim().min(2).max(100).optional(),
    bairro: z.string().trim().min(2).max(100).optional(),
    avaliacao_minima: z.coerce.number().min(0).max(5).optional(),
    preco_minimo: z.coerce.number().nonnegative().optional(),
    preco_maximo: z.coerce.number().nonnegative().optional(),
    servico_id: z.coerce.number().int().positive().optional(),
    ordenar_por: z.enum(["recentes", "nome", "avaliacao"]).default("recentes"),
    ordem: z.enum(["asc", "desc"]).default("desc"),
  }).strict().refine(
    (data) => data.preco_minimo === undefined || data.preco_maximo === undefined || data.preco_minimo <= data.preco_maximo,
    { message: "Preço mínimo não pode ser maior que o máximo." },
  ),
});

export const diaristaParamsSchema = z.object({
  params: z.object({ id_diarista: z.coerce.number().int().positive() }).strict(),
});

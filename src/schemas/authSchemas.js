import { z } from "zod";

const email = z.string().trim().toLowerCase().email().max(100);
const password = z.string().min(8).max(100);
const cpf = z.string().trim().regex(/^\d{11}$/, "CPF deve conter 11 dígitos.").optional();
const commonRegistration = {
  nome: z.string().trim().min(3).max(100),
  email,
  senha: password,
  cpf,
  telefone: z.string().trim().min(10).max(20),
  foto_perfil: z.string().trim().url().max(255).optional().nullable(),
};

const clientRegistration = z.object({
  ...commonRegistration,
  tipo: z.literal("CLIENTE"),
  data_nascimento: z.coerce.date().max(new Date(), "Data de nascimento não pode estar no futuro."),
  qtd_comodos: z.coerce.number().int().positive(),
  tamanho_casa: z.enum(["pequena", "media", "grande"]),
}).strict();

const workerRegistration = z.object({
  ...commonRegistration,
  tipo: z.literal("DIARISTA"),
  descricao: z.string().trim().min(20).max(2000),
  qtd_max_comodos: z.coerce.number().int().positive(),
}).strict();

export const registerSchema = z.object({
  body: z.discriminatedUnion("tipo", [clientRegistration, workerRegistration]),
});

export const loginSchema = z.object({
  body: z.object({ email, senha: z.string().min(1).max(100) }).strict(),
});

export const changePasswordSchema = z.object({
  body: z.object({ senha_atual: z.string().min(1).max(100), nova_senha: password }).strict(),
});

import prisma from "../lib/prisma.js";

export class ServicoRepository {
  findAll() {
    return prisma.servico.findMany({
      select: { id_servico: true, nome_servico: true, descricao: true },
      orderBy: { nome_servico: "asc" },
    });
  }
}

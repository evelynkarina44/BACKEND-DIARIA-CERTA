import prisma from "../lib/prisma.js";

const publicWorkerSelect = {
  id_diarista: true,
  descricao: true,
  qtd_max_comodos: true,
  avaliacao_media: true,
  usuario: { select: { nome: true, foto_perfil: true } },
  diarista_servico: {
    where: { ativo: true },
    select: {
      id_diarista_servico: true,
      preco: true,
      adicional: true,
      faz_parte_combo_base: true,
      duracao_estimada_min: true,
      servico: { select: { id_servico: true, nome_servico: true, descricao: true } },
    },
  },
  combo_base: {
    where: { ativo: true },
    select: {
      id_combo_base: true,
      nome_combo: true,
      valor_base: true,
      descricao: true,
      qtd_comodos_casa: true,
      atende_casa_pequena: true,
      atende_casa_media: true,
      atende_casa_grande: true,
    },
  },
};

export class DiaristaRepository {
  async search(filters) {
    const { page, limit, nome, cidade, bairro, avaliacao_minima, preco_minimo, preco_maximo, servico_id, ordenar_por, ordem } = filters;
    const serviceFilter = {
      ativo: true,
      ...(servico_id ? { id_servico: servico_id } : {}),
      ...(preco_minimo !== undefined || preco_maximo !== undefined
        ? { preco: { ...(preco_minimo !== undefined ? { gte: preco_minimo } : {}), ...(preco_maximo !== undefined ? { lte: preco_maximo } : {}) } }
        : {}),
    };
    const where = {
      ativo: true,
      usuario: { ativo: true, bloqueado: false, ...(nome ? { nome: { contains: nome } } : {}) },
      ...(avaliacao_minima !== undefined ? { avaliacao_media: { gte: avaliacao_minima } } : {}),
      ...(servico_id || preco_minimo !== undefined || preco_maximo !== undefined ? { diarista_servico: { some: serviceFilter } } : {}),
      ...(cidade || bairro ? { endereco: { some: { ativo: true, ...(cidade ? { cidade: { contains: cidade } } : {}), ...(bairro ? { bairro: { contains: bairro } } : {}) } } } : {}),
    };

    const orderBy = ordenar_por === "nome"
      ? { usuario: { nome: ordem } }
      : ordenar_por === "avaliacao"
        ? { avaliacao_media: ordem }
        : { id_diarista: ordem };

    const [total, data] = await prisma.$transaction([
      prisma.diarista.count({ where }),
      prisma.diarista.findMany({ where, select: publicWorkerSelect, orderBy, skip: (page - 1) * limit, take: limit }),
    ]);
    return { data, total };
  }

  findPublicById(id_diarista) {
    return prisma.diarista.findFirst({
      where: { id_diarista, ativo: true, usuario: { ativo: true, bloqueado: false } },
      select: publicWorkerSelect,
    });
  }
}

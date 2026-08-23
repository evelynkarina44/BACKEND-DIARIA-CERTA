import prisma from '../../lib/prisma.js';
import { currentLocalDate } from '../../utils/dateTime.js';
import { calculateDistanceKm, coordinatesByCep } from '../location/CepGeocodingService.js';
import { ExternalServiceError } from '../../errors/index.js';

function publicProfileInclude() {
  const today = currentLocalDate();
  return {
  usuario: { select: { nome: true, foto_perfil: true } },
  endereco: { select: { bairro: true, cidade: true, estado: true, cep: true } },
  diarista_servico: {
    where: { ativo: true },
    include: { servico: true },
    orderBy: { preco: 'asc' },
  },
  combo_base: {
    where: { ativo: true },
    select: {
      id_combo_base: true,
      id_diarista: true,
      nome_combo: true,
      valor_base: true,
      descricao: true,
      qtd_comodos_casa: true,
      atende_casa_pequena: true,
      atende_casa_media: true,
      atende_casa_grande: true,
      ativo: true,
      combo_servico: { include: { servico: true } },
    },
  },
  disponibilidade_diarista: {
    where: { disponivel: true, dia_semana: { gte: today } },
    orderBy: [{ dia_semana: 'asc' }, { horario_inicio: 'asc' }],
  },
  avaliacao: {
    where: { comentario_publico: true },
    orderBy: { data_avaliacao: 'desc' },
    take: 20,
    select: {
      id_avaliacao: true,
      nota: true,
      comentario: true,
      data_avaliacao: true,
    },
  },
  };
}

function present(profile, serviceCatalog = [], distanceKm = null) {
  const prices = profile.diarista_servico.map((item) => Number(item.preco));
  const offeredServiceIds = new Set(profile.diarista_servico.map((item) => item.id_servico));
  const publicAddresses = profile.endereco.map(({ cep: _cep, ...address }) => address);
  return {
    ...profile,
    endereco: publicAddresses,
    distancia_km: Number.isFinite(distanceKm) ? Number(distanceKm.toFixed(2)) : null,
    avaliacao_media: profile.avaliacao_media === null ? null : Number(profile.avaliacao_media),
    valor_medio_diaria: prices.length ? Number((prices.reduce((sum, price) => sum + price, 0) / prices.length).toFixed(2)) : null,
    diarista_servico: profile.diarista_servico.map((item) => ({ ...item, preco: Number(item.preco) })),
    servicos_nao_realizados: serviceCatalog.filter((item) => !offeredServiceIds.has(item.id_servico)),
    combo_base: profile.combo_base.map((combo) => ({ ...combo, valor_base: Number(combo.valor_base) })),
    avaliacao: profile.avaliacao.map((item) => ({ ...item, nota: Number(item.nota), autor: 'Cliente' })),
  };
}

export class DiaristaSearchService {
  async list({ page = 1, limit = 20, nome, bairro, cidade, estado, avaliacao_min, preco_min, preco_max, id_servico, cep_origem, distancia_max, ordenar = 'avaliacao' } = {}) {
    const serviceFilter = {};
    if (id_servico) serviceFilter.id_servico = id_servico;
    if (preco_min !== undefined || preco_max !== undefined) {
      serviceFilter.preco = { ...(preco_min !== undefined ? { gte: preco_min } : {}), ...(preco_max !== undefined ? { lte: preco_max } : {}) };
    }

    const where = {
      ...(nome ? { usuario: { nome: { contains: nome } } } : {}),
      ...(avaliacao_min !== undefined ? { avaliacao_media: { gte: avaliacao_min } } : {}),
      ...(bairro || cidade || estado ? { endereco: { some: { ...(bairro ? { bairro: { contains: bairro } } : {}), ...(cidade ? { cidade: { contains: cidade } } : {}), ...(estado ? { estado } : {}) } } } : {}),
      ...(Object.keys(serviceFilter).length ? { diarista_servico: { some: serviceFilter } } : {}),
    };

    const [rawProfiles, serviceCatalog] = await Promise.all([
      prisma.diarista.findMany({ where, include: publicProfileInclude() }),
      prisma.servico.findMany({ orderBy: { nome_servico: 'asc' } }),
    ]);
    const origin = cep_origem ? await coordinatesByCep(cep_origem) : null;
    if (cep_origem && !origin) {
      throw new ExternalServiceError('Não foi possível obter a localização do CEP do cliente');
    }
    let profiles = await Promise.all(rawProfiles.map(async (profile) => {
      const destination = origin && profile.endereco[0]?.cep
        ? await coordinatesByCep(profile.endereco[0].cep)
        : null;
      const distanceKm = origin && destination ? calculateDistanceKm(origin, destination) : null;
      return present(profile, serviceCatalog, distanceKm);
    }));
    if (distancia_max !== undefined) {
      profiles = profiles.filter((profile) => profile.distancia_km !== null && profile.distancia_km <= distancia_max);
    }
    const sorters = {
      avaliacao: (a, b) => (b.avaliacao_media ?? -1) - (a.avaliacao_media ?? -1),
      preco_asc: (a, b) => (a.valor_medio_diaria ?? Infinity) - (b.valor_medio_diaria ?? Infinity),
      preco_desc: (a, b) => (b.valor_medio_diaria ?? -1) - (a.valor_medio_diaria ?? -1),
      nome: (a, b) => a.usuario.nome.localeCompare(b.usuario.nome, 'pt-BR'),
      distancia: (a, b) => (a.distancia_km ?? Infinity) - (b.distancia_km ?? Infinity)
        || (b.avaliacao_media ?? -1) - (a.avaliacao_media ?? -1),
    };
    profiles.sort(sorters[ordenar]);
    const total = profiles.length;
    return {
      data: profiles.slice((page - 1) * limit, page * limit),
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    };
  }

  async find(id) {
    const [profile, serviceCatalog] = await Promise.all([
      prisma.diarista.findUnique({ where: { id_diarista: Number(id) }, include: publicProfileInclude() }),
      prisma.servico.findMany({ orderBy: { nome_servico: 'asc' } }),
    ]);
    return profile ? present(profile, serviceCatalog) : null;
  }
}

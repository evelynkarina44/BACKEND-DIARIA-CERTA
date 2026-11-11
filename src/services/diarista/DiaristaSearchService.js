// APOIO POLLYANA — catalogProfiles() consulta cadastro; bookingCandidates() verifica agenda.
// Mostrar apenas se precisar detalhar o acesso ao banco nas etapas 2 e 4 do roteiro.
import prisma from '../../lib/prisma.js';
import { currentLocalDate } from '../../utils/dateTime.js';
import { calculateDistanceKm, coordinatesByCep } from '../location/CepGeocodingService.js';
import { ExternalServiceError } from '../../errors/index.js';
import { intervalsOverlap } from '../agendamento/availabilityPolicy.js';
import { responseHistoryInclude, respondsQuickly } from './responseSpeedPolicy.js';
import { serviceSearchTerms } from '../../utils/serviceSearchTerms.js';

function bookingProfileWhere({ serviceIds, userId, comboId }) {
  return {
    id_usuario: { not: userId },
    usuario: { ativo: true, bloqueado: false },
    AND: serviceIds.map((id_servico) => ({ diarista_servico: { some: { id_servico, ativo: true } } })),
    ...(comboId ? { combo_base: { some: { id_combo_base: comboId, ativo: true } } } : {}),
  };
}

function publicProfileInclude() {
  const today = currentLocalDate();
  return {
  usuario: { select: { nome: true, foto_perfil: true } },
  agendamento: responseHistoryInclude,
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
  const { agendamento: responseHistory, ...publicProfile } = profile;
  const prices = profile.diarista_servico.map((item) => Number(item.preco));
  const offeredServiceIds = new Set(profile.diarista_servico.map((item) => item.id_servico));
  const publicAddresses = profile.endereco.map(({ cep: _cep, ...address }) => address);
  return {
    ...publicProfile,
    responde_rapido: respondsQuickly(responseHistory),
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
  constructor(database = prisma) { this.database = database; }

  // APOIO | ETAPA 2 — Selecionar dados públicos e ofertas ativas; nomes ambíguos exigem esclarecimento.
  async catalogProfiles({ nome, id }) {
    const base = { usuario: { ativo: true, bloqueado: false } };
    const select = {
      id_diarista: true, descricao: true, avaliacao_media: true,
      usuario: { select: { nome: true } },
      endereco: { select: { cidade: true, estado: true } },
      diarista_servico: {
        where: { ativo: true }, orderBy: { id_diarista_servico: 'asc' },
        select: { id_servico: true, preco: true, servico: { select: { nome_servico: true, descricao: true } } },
      },
      combo_base: {
        where: { ativo: true }, orderBy: { id_combo_base: 'asc' },
        select: {
          nome_combo: true, descricao: true, valor_base: true,
          atende_casa_pequena: true, atende_casa_media: true, atende_casa_grande: true,
          combo_servico: { orderBy: { id_combo_servico: 'asc' }, select: { id_servico: true, servico: { select: { nome_servico: true } } } },
        },
      },
    };
    const query = (where) => this.database.diarista.findMany({ where, select, take: 6, orderBy: { id_diarista: 'asc' } });
    if (id) return query({ ...base, id_diarista: id });
    if (!nome?.trim()) return [];
    const name = nome.trim();
    const exact = await query({ usuario: { ...base.usuario, nome: { equals: name } } });
    return exact.length ? exact : query({ usuario: { ...base.usuario, nome: { contains: name } } });
  }

  // APOIO | ETAPA 4 — Horário cadastrado e ausência de conflito com Aceito ou Em_andamento.
  // Pedidos Pendentes não bloqueiam o intervalo como uma reserva aceita.
  async bookingCandidates({ date, start, serviceIds, userId, comboId }) {
    const profiles = await this.database.diarista.findMany({
      where: {
        ...bookingProfileWhere({ serviceIds, userId, comboId }),
        disponibilidade_diarista: { some: { dia_semana: date, disponivel: true, horario_fim: { not: null } } },
      },
      include: {
        ...publicProfileInclude(),
        disponibilidade_diarista: { where: { dia_semana: date, disponivel: true }, orderBy: { horario_inicio: 'asc' } },
        agendamento: { where: { data_agendamento: date, status: { in: ['Aceito', 'Em_andamento'] } }, select: { horario_inicio: true, horario_fim: true } },
      },
      orderBy: { id_diarista: 'asc' },
    });
    return profiles.filter((profile) => {
      const slot = profile.disponibilidade_diarista.find((item) => item.horario_inicio.getTime() === start.getTime() && item.horario_fim);
      return slot && !profile.agendamento.some((appointment) => intervalsOverlap(slot, appointment));
    });
  }

  async bookingOverview({ date, serviceIds, userId, comboId }) {
    const today = currentLocalDate();
    const maxDate = new Date(today); maxDate.setUTCDate(maxDate.getUTCDate() + 365);
    const rangeEnd = new Date(date); rangeEnd.setUTCDate(rangeEnd.getUTCDate() + 90);
    const range = { gte: today, lte: rangeEnd < maxDate ? rangeEnd : maxDate };
    const [profiles, ownProfile] = await Promise.all([
      this.database.diarista.findMany({
        where: bookingProfileWhere({ serviceIds, userId, comboId }),
        select: {
          endereco: { select: { cep: true } },
          disponibilidade_diarista: {
            where: { dia_semana: range, disponivel: true, horario_fim: { not: null } },
            orderBy: [{ dia_semana: 'asc' }, { horario_inicio: 'asc' }],
            select: { dia_semana: true, horario_inicio: true, horario_fim: true },
          },
          agendamento: {
            where: { data_agendamento: range, status: { in: ['Aceito', 'Em_andamento'] } },
            select: { data_agendamento: true, horario_inicio: true, horario_fim: true },
          },
        },
      }),
      this.database.diarista.findUnique({
        where: { id_usuario: userId },
        select: {
          diarista_servico: { where: { ativo: true }, select: { id_servico: true } },
          disponibilidade_diarista: { where: { dia_semana: date, disponivel: true }, select: { horario_inicio: true } },
        },
      }),
    ]);
    return { profiles, ownProfile };
  }

  async list({ page = 1, limit = 20, nome, bairro, cidade, estado, avaliacao_min, preco_min, preco_max, id_servico, servico_nome, cep_origem, distancia_max, responde_rapido, ordenar = 'avaliacao' } = {}) {
    const serviceFilter = {};
    if (id_servico) serviceFilter.id_servico = id_servico;
    const serviceTerms = serviceSearchTerms(servico_nome);
    if (preco_min !== undefined || preco_max !== undefined) {
      serviceFilter.preco = { ...(preco_min !== undefined ? { gte: preco_min } : {}), ...(preco_max !== undefined ? { lte: preco_max } : {}) };
    }

    const where = {
      usuario: { ativo: true, bloqueado: false, ...(nome ? { nome: { contains: nome } } : {}) },
      ...(avaliacao_min !== undefined ? { avaliacao_media: { gte: avaliacao_min } } : {}),
      ...(bairro || cidade || estado ? { endereco: { some: { ...(bairro ? { bairro: { contains: bairro } } : {}), ...(cidade ? { cidade: { contains: cidade } } : {}), ...(estado ? { estado } : {}) } } } : {}),
      ...(serviceTerms.length ? {
        AND: serviceTerms.map((term) => ({
          diarista_servico: { some: { ...serviceFilter, ativo: true, servico: { nome_servico: { contains: term } } } },
        })),
      } : Object.keys(serviceFilter).length ? { diarista_servico: { some: { ...serviceFilter, ativo: true } } } : {}),
    };

    const [rawProfiles, serviceCatalog] = await Promise.all([
      this.database.diarista.findMany({ where, include: publicProfileInclude() }),
      this.database.servico.findMany({ orderBy: { nome_servico: 'asc' } }),
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
    if (responde_rapido === true) profiles = profiles.filter((profile) => profile.responde_rapido);
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
      this.database.diarista.findUnique({ where: { id_diarista: Number(id) }, include: publicProfileInclude() }),
      this.database.servico.findMany({ orderBy: { nome_servico: 'asc' } }),
    ]);
    return profile ? present(profile, serviceCatalog) : null;
  }
}

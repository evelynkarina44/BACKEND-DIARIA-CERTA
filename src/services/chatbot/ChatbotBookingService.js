// POLLYANA | ETAPA 4 — Completar pedido, buscar profissional e preparar proposta.
// Começar em propose(); summarize() reutiliza as regras reais de agendamento e preço.
// Auxiliares: rankByDistance() ordena, candidatePayload() monta dados e comboOptions() lista combos.
import { createHash } from 'node:crypto';
import prisma from '../../lib/prisma.js';
import { BadRequestError, ConflictError } from '../../errors/index.js';
import { createAgendamentoSchema } from '../../schemas/apiSchemas.js';
import { DiaristaSearchService } from '../diarista/DiaristaSearchService.js';
import { coordinatesByCep, calculateDistanceKm } from '../location/CepGeocodingService.js';
import { AgendamentoWorkflowService } from '../agendamento/AgendamentoWorkflowService.js';
import { combineDateAndTime } from '../../utils/dateTime.js';
import { intervalsOverlap } from '../agendamento/availabilityPolicy.js';

const time = (value) => value?.toISOString().slice(11, 16);
function canonical(value) {
  if (Array.isArray(value)) return value.map(canonical);
  if (value && typeof value === 'object') return Object.fromEntries(Object.keys(value).sort().map((key) => [key, canonical(value[key])]));
  return value;
}
export const proposalSignature = (payload, summary) => createHash('sha256').update(JSON.stringify(canonical({ payload, summary }))).digest('hex');

export class ChatbotBookingService {
  constructor(database = prisma, geocode = coordinatesByCep) {
    this.database = database;
    this.geocode = geocode;
  }

  async client(auth) {
    return this.database.cliente.findUnique({
      where: { id_cliente: auth.id_cliente },
      select: { id_cliente: true, qtd_comodos: true, tamanho_casa: true, endereco: { orderBy: { id_endereco: 'asc' } } },
    });
  }

  async rankByDistance(profiles, origin) {
    const ranked = await Promise.all(profiles.map(async (profile) => {
      const cep = profile.endereco[0]?.cep;
      const coordinates = cep ? await this.geocode(cep) : null;
      const distance = coordinates ? calculateDistanceKm(origin, coordinates) : null;
      return { profile, distance };
    }));
    // Localizações desconhecidas ficam por último; o ID desempata distâncias iguais.
    return ranked.sort((a, b) => {
      const distanceOrder = (a.distance ?? Infinity) - (b.distance ?? Infinity);
      return distanceOrder || a.profile.id_diarista - b.profile.id_diarista;
    });
  }

  // Monta os dados de uma candidata; summarize() ainda revalida todas as regras.
  candidatePayload(profile, state, client, address, date, start) {
    const slot = profile.disponibilidade_diarista.find((item) =>
      item.dia_semana.getTime() === date.getTime()
      && item.horario_inicio.getTime() === start.getTime());
    if (!slot?.horario_fim) return null;

    const combo = state.id_combo_base
      ? profile.combo_base.find((item) => item.id_combo_base === state.id_combo_base)
      : null;
    if (state.id_combo_base && !combo) return null;

    const comboServices = combo?.combo_servico.map((item) => item.id_servico) || [];
    const serviceIds = new Set([...state.servicos, ...comboServices]);
    const services = profile.diarista_servico
      .filter((item) => serviceIds.has(item.id_servico))
      .map((item) => ({ id_diarista_servico: item.id_diarista_servico }))
      .sort((a, b) => a.id_diarista_servico - b.id_diarista_servico);
    if (services.length !== serviceIds.size) return null;

    return {
      id_diarista: profile.id_diarista,
      id_endereco: address.id_endereco,
      ...(combo ? { id_combo_base: combo.id_combo_base } : {}),
      data_agendamento: state.data,
      horario_inicio: state.horario,
      horario_fim: time(slot.horario_fim),
      qtd_comodos: address.qtd_comodos ?? client.qtd_comodos,
      tamanho_residencia: address.tamanho_casa ?? client.tamanho_casa,
      servicos: services,
    };
  }

  comboOptions(profile, state, client, address) {
    const availableServiceIds = new Set(profile.diarista_servico.map((item) => item.id_servico));
    const options = [];
    if (state.id_combo_base) {
      options.push({ tipo: 'combo', id: null, label: 'Somente serviços individuais' });
    }
    for (const combo of profile.combo_base) {
      const servesHouseSize = combo[`atende_casa_${address?.tamanho_casa ?? client.tamanho_casa}`];
      const offersAllServices = combo.combo_servico.every((service) => availableServiceIds.has(service.id_servico));
      if (servesHouseSize && offersAllServices && combo.id_combo_base !== state.id_combo_base) {
        options.push({ tipo: 'combo', id: combo.id_combo_base, label: `${combo.nome_combo} — inclui os serviços do combo` });
      }
    }
    return options;
  }

  // APOIO POLLYANA | ETAPAS 5 E 6 — Revalidar endereço, preço e dados para comparar a proposta.
  async summarize(payload, auth, database = this.database) {
    const client = await new ChatbotBookingService(database, this.geocode).client(auth);
    const address = client?.endereco.find((item) => item.id_endereco === payload.id_endereco);
    if (!address) throw new ConflictError('O endereço mudou. Peça uma nova proposta ao assistente.');
    const currentPayload = { ...payload, qtd_comodos: address.qtd_comodos ?? client.qtd_comodos, tamanho_residencia: address.tamanho_casa ?? client.tamanho_casa };
    const parsed = createAgendamentoSchema.parse(currentPayload);
    const pricing = await new AgendamentoWorkflowService(database).validateAndPrice(parsed, auth);
    const profile = await database.diarista.findUnique({
      where: { id_diarista: parsed.id_diarista },
      select: {
        usuario: { select: { nome: true, foto_perfil: true } },
        diarista_servico: {
          where: { id_diarista_servico: { in: parsed.servicos.map((item) => item.id_diarista_servico) } },
          include: { servico: true },
        },
        combo_base: {
          where: { id_combo_base: parsed.id_combo_base || -1 },
          select: { nome_combo: true },
        },
      },
    });
    const summary = {
      diarista: { id_diarista: parsed.id_diarista, nome: profile.usuario.nome, foto_perfil: profile.usuario.foto_perfil },
      data: currentPayload.data_agendamento, horario_inicio: currentPayload.horario_inicio,
      endereco: `${address.apelido ? `${address.apelido} — ` : ''}${address.logradouro}, ${address.numero}${address.complemento ? ` - ${address.complemento}` : ''} - ${address.bairro}, ${address.cidade}/${address.estado} - CEP ${address.cep}`,
      qtd_comodos: currentPayload.qtd_comodos, tamanho_casa: currentPayload.tamanho_residencia,
      servicos: profile.diarista_servico.sort((a, b) => a.id_diarista_servico - b.id_diarista_servico).map((item) => ({ id_diarista_servico: item.id_diarista_servico, nome: item.servico.nome_servico, preco: Number(item.preco) })),
      combo: profile.combo_base[0]?.nome_combo || null,
      valor_estimado: pricing.valor_estimado,
    };
    return { payload: currentPayload, summary, assinatura: proposalSignature(currentPayload, summary) };
  }

  // APOIO | DEMONSTRACAO — Explicar ausência de agenda, conflito ou localização sem inventar horários.
  async explainNoAvailability(state, auth, catalog) {
    const date = new Date(`${state.data}T00:00:00Z`);
    const { profiles, ownProfile } = await new DiaristaSearchService(this.database).bookingOverview({ date, serviceIds: state.servicos, userId: auth.id_usuario, comboId: state.id_combo_base });
    const services = catalog.filter((item) => state.servicos.includes(item.id_servico)).map((item) => `“${item.nome_servico}”`).join(', ');
    const when = `${state.data.split('-').reverse().join('/')} às ${state.horario}`;
    const ownMatch = ownProfile && state.servicos.every((id) => ownProfile.diarista_servico.some((item) => item.id_servico === id))
      && ownProfile.disponibilidade_diarista.some((slot) => time(slot.horario_inicio) === state.horario);
    const selfNote = ownMatch ? ' Há esse horário no seu próprio perfil de diarista, mas não é permitido contratar a mesma conta.' : '';
    let explanation;
    if (!profiles.length) {
      explanation = state.id_combo_base ? 'Não encontrei outra diarista elegível com esse combo e os serviços selecionados.' : `Não encontrei outra diarista ativa que ofereça todos os serviços selecionados: ${services}.`;
    } else {
      const now = new Date();
      const registered = profiles.flatMap((profile) => profile.disponibilidade_diarista
        .filter((slot) => slot.horario_fim > slot.horario_inicio && combineDateAndTime(slot.dia_semana, slot.horario_inicio) > now)
        .map((slot) => ({ profile, slot })));
      const available = registered.filter(({ profile, slot }) => !profile.agendamento.some((appointment) => appointment.data_agendamento.getTime() === slot.dia_semana.getTime() && intervalsOverlap(appointment, slot)));
      const withAddress = available.filter(({ profile }) => profile.endereco.some((address) => address.cep));
      if (!registered.length) {
        explanation = `Não encontrei horários futuros cadastrados nas agendas das outras diaristas que oferecem ${services}. Por isso, não consigo enviar uma solicitação para ${when}.`;
      } else if (!available.length) {
        explanation = `Os horários cadastrados para ${services} estão ocupados por agendamentos aceitos ou em andamento. Não encontrei um horário livre para ${when}.`;
      } else if (!withAddress.length) {
        explanation = `Há horários cadastrados para ${services}, mas as profissionais estão sem endereço informado. Não consigo calcular a proximidade para apresentar uma proposta.`;
      } else {
        const dayKey = (slot) => slot.dia_semana.toISOString().slice(0, 10);
        const sameDay = withAddress.filter(({ slot }) => dayKey(slot) === state.data);
        const alternatives = [...new Set((sameDay.length ? sameDay : withAddress)
          .map(({ slot }) => `${dayKey(slot)}|${time(slot.horario_inicio)}`))].sort().slice(0, 5);
        const labels = alternatives.map((key) => {
          const [day, hour] = key.split('|');
          return `${day.split('-').reverse().join('/')} às ${hour}`;
        });
        explanation = `Não encontrei uma profissional elegível para ${services} em ${when}. Há outros horários cadastrados para consultar: ${labels.join('; ')}. Qual deles você prefere que eu verifique?`;
      }
    }
    return { texto: explanation + selfNote, opcoes: [] };
  }

  // POLLYANA | ETAPA 4 — Mostrar perguntas de endereço, data, horário e serviços faltantes.
  // Com os dados completos, verificar a agenda antes de apresentar uma proposta ao cliente.
  async propose(state, auth, catalog) {
    const client = await this.client(auth);
    if (!client?.endereco.length) return { texto: 'Cadastre seu endereço em Meu perfil para eu buscar uma diarista próxima.', opcoes: [] };
    const serviceOptions = catalog.map((item) => ({ tipo: 'servico', id: item.id_servico, label: item.nome_servico }));
    if (state.nao_encontrados?.length) return { texto: `Não consegui relacionar com segurança estes pedidos ao catálogo: ${state.nao_encontrados.join(', ')}. Escolha um serviço cadastrado abaixo ou explique melhor.`, opcoes: serviceOptions };
    if (!state.data) return { texto: 'Para qual dia você precisa da diária?', opcoes: [] };
    if (!state.horario) return { texto: 'Qual horário você prefere para iniciar a diária? Por exemplo: 09:00.', opcoes: [] };
    if (!state.servicos?.length) return { texto: 'Quais serviços você deseja? Escolha no catálogo ou escreva os nomes.', opcoes: serviceOptions };
    if (state.servicos.some((id) => !catalog.some((item) => item.id_servico === id))) throw new BadRequestError('Um serviço não está mais disponível. Escolha novamente no catálogo.');
    let address = null;
    if (state.id_endereco) {
      address = client.endereco.find((item) => item.id_endereco === state.id_endereco);
    } else if (client.endereco.length === 1) {
      address = client.endereco[0];
    }
    if (!address) return { texto: 'Em qual casa será a diária? Selecione antes de enviar a solicitação.', opcoes: client.endereco.map((item) => ({ tipo: 'endereco', id: item.id_endereco, label: `${item.apelido || `Casa ${item.id_endereco}`} — ${item.logradouro}, ${item.numero} - ${item.bairro}` })) };
    const date = new Date(`${state.data}T00:00:00Z`);
    const start = new Date(`1970-01-01T${state.horario}:00Z`);
    if (combineDateAndTime(date, start) <= new Date()) return { texto: 'Esse horário já passou. Escolha uma data e um horário futuros.', opcoes: [] };
    // Destacar bookingCandidates(): conta ativa, serviços e horário cadastrado; exclui o próprio usuário.
    // Cômodos continuam informativos, sem comparação bloqueadora com o limite da profissional.
    const profiles = await new DiaristaSearchService(this.database).bookingCandidates({ date, start, serviceIds: state.servicos, userId: auth.id_usuario, comboId: state.id_combo_base });
    if (!profiles.length) return this.explainNoAvailability(state, auth, catalog);
    const origin = await this.geocode(address.cep);
    if (!origin) return { texto: 'Não consegui calcular a localização do seu CEP agora. Tente novamente ou utilize a busca manual.', opcoes: [] };
    const ranked = await this.rankByDistance(profiles, origin);
    let validationFailure;
    for (const { profile, distance } of ranked) {
      if (distance === null) continue;
      const payload = this.candidatePayload(profile, state, client, address, date, start);
      if (!payload) continue;
      try {
        const proposal = await this.summarize(payload, auth);
        return {
          texto: 'Encontrei uma profissional compatível com seu pedido. Confira os dados e confirme para enviar uma solicitação. O aceite depende da diarista.',
          opcoes: this.comboOptions(profile, state, client, address),
          proposal: { ...proposal, resumo: { ...proposal.summary, distancia_km: Number(distance.toFixed(2)) } },
        };
      } catch (error) {
        if (error instanceof ConflictError || error instanceof BadRequestError) {
          validationFailure = error.message;
          continue;
        }
        throw error;
      }
    }
    if (ranked.every((item) => item.distance === null)) return { texto: 'Encontrei profissionais com os serviços e o horário solicitados, mas não consegui obter a localização dos CEPs delas. Tente novamente em instantes; ainda não foi criada uma solicitação.', opcoes: [] };
    if (validationFailure) return { texto: `Não consegui validar a proposta com os dados atuais: ${validationFailure}. Você pode pedir uma nova busca.`, opcoes: [] };
    return this.explainNoAvailability(state, auth, catalog);
  }
}

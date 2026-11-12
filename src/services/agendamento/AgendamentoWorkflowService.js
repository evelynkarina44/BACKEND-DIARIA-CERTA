// POLLYANA | ETAPA 5 — Preço e regras ficam no backend, não no Gemini.
// Ir ao cálculo em validateAndPrice(); o mesmo fluxo atende o agendamento tradicional e o chatbot.
import prisma from '../../lib/prisma.js';
import { BadRequestError, ConflictError, ForbiddenError, NotFoundError } from '../../errors/index.js';
import { combineDateAndTime, currentLocalDate } from '../../utils/dateTime.js';
import { findBookingConflict, findDuplicateRequest, lockDiarista } from './availabilityPolicy.js';
import { checkinExpirationInfo } from './checkinExpirationPolicy.js';

const agendamentoInclude = {
  cliente: { include: { usuario: { select: { nome: true, foto_perfil: true, telefone: true } } } },
  diarista: { include: { usuario: { select: { nome: true, foto_perfil: true, telefone: true } } } },
  combo_base: { select: { id_combo_base: true, nome_combo: true, valor_base: true } },
  endereco: true,
  agendamento_servico: { include: { diarista_servico: { include: { servico: true } } } },
  checkin_checkout: true,
  avaliacao: {
    where: { autor_tipo: 'Cliente' },
    select: { id_avaliacao: true, autor_tipo: true, nota: true, comentario: true, data_avaliacao: true, anonima: true },
  },
  ocorrencia_agendamento: { orderBy: { data_ocorrencia: 'desc' } },
};

function isParticipant(appointment, auth) {
  return appointment.id_cliente === auth?.id_cliente || appointment.id_diarista === auth?.id_diarista;
}

function present(appointment) {
  return {
    ...appointment,
    ...checkinExpirationInfo(appointment),
    valor_estimado: appointment.valor_estimado === null ? null : Number(appointment.valor_estimado),
    combo_base: appointment.combo_base ? { ...appointment.combo_base, valor_base: Number(appointment.combo_base.valor_base) } : null,
    agendamento_servico: appointment.agendamento_servico?.map((item) => ({ ...item, preco: Number(item.preco) })) ?? [],
    avaliacao: appointment.avaliacao?.map((review) => ({ ...review, nota: Number(review.nota) })) ?? [],
  };
}

export class AgendamentoWorkflowService {
  constructor(database = prisma) { this.database = database; }

  async expirePending() {
    return this.database.agendamento.updateMany({
      where: { status: 'Pendente', expira_em: { lte: new Date() } },
      data: { status: 'Expirado', respondido_em: new Date() },
    });
  }

  async validateAndPrice(data, auth) {
    if (!auth?.id_cliente) throw new ForbiddenError('É necessário um perfil de cliente');

    const [diarista, endereco, services, availabilitySlots] = await Promise.all([
      this.database.diarista.findUnique({
        where: { id_diarista: data.id_diarista },
        include: {
          usuario: { select: { ativo: true, bloqueado: true } },
          combo_base: {
            where: { ativo: true },
            select: {
              id_combo_base: true,
              valor_base: true,
              atende_casa_pequena: true,
              atende_casa_media: true,
              atende_casa_grande: true,
              combo_servico: { select: { id_servico: true } },
            },
          },
        },
      }),
      this.database.endereco.findUnique({ where: { id_endereco: data.id_endereco } }),
      this.database.diarista_servico.findMany({
        where: { id_diarista_servico: { in: data.servicos.map((item) => item.id_diarista_servico) } },
      }),
      this.database.disponibilidade_diarista.findMany({
        where: {
          id_diarista: data.id_diarista,
          dia_semana: data.data_agendamento,
          disponivel: true,
        },
      }),
    ]);

    if (!diarista) throw new NotFoundError('Diarista não encontrada');
    if (!diarista.usuario?.ativo || diarista.usuario.bloqueado) throw new ConflictError('Diarista não está disponível para contratação');
    if (diarista.id_usuario === auth.id_usuario) throw new BadRequestError('Não é possível agendar o próprio perfil de diarista');
    if (!endereco || endereco.id_cliente !== auth.id_cliente) throw new ForbiddenError('Endereço não pertence ao cliente autenticado');
    if (services.length !== data.servicos.length || services.some((item) => item.id_diarista !== data.id_diarista || !item.ativo)) {
      throw new BadRequestError('Um ou mais serviços não pertencem à diarista selecionada');
    }
    const requestedStart = data.horario_inicio.toISOString().slice(11, 19);
    const availability = availabilitySlots.find(
      (slot) => slot.horario_inicio.toISOString().slice(11, 19) === requestedStart,
    );
    if (!availability) throw new ConflictError('Horário de início não está disponível para a data selecionada');
    if (!availability.horario_fim || data.horario_fim.getTime() !== availability.horario_fim.getTime()) {
      throw new ConflictError('O intervalo deve corresponder à disponibilidade cadastrada');
    }
    const conflict = await findBookingConflict(this.database, data);
    if (conflict) throw new ConflictError('Já existe um agendamento aceito nesse horário');

    const startsAt = combineDateAndTime(data.data_agendamento, data.horario_inicio);
    if (startsAt <= new Date()) throw new BadRequestError('O agendamento deve ser futuro');

    const sizeField = `atende_casa_${data.tamanho_residencia}`;
    const selectedCombo = data.id_combo_base
      ? diarista.combo_base.find((combo) => combo.id_combo_base === data.id_combo_base)
      : null;
    if (data.id_combo_base && !selectedCombo) throw new BadRequestError('Combo não pertence à diarista ou está inativo');
    if (selectedCombo && !selectedCombo[sizeField]) {
      throw new BadRequestError('Combo incompatível com o tamanho da residência');
    }

    const serviceIds = new Set(services.map((item) => item.id_servico));
    const comboServiceIds = new Set(selectedCombo?.combo_servico.map((item) => item.id_servico) ?? []);
    if (selectedCombo && [...comboServiceIds].some((id) => !serviceIds.has(id))) {
      throw new BadRequestError('Inclua todos os serviços pertencentes ao combo selecionado');
    }
    // POLLYANA | ETAPA 5 — Sem combo: soma dos serviços. Com combo: base + extras.
    // Não cobrar novamente como extra um serviço já incluído no combo.
    const extras = services.filter((item) => !comboServiceIds.has(item.id_servico));
    const estimated = selectedCombo
      ? Number(selectedCombo.valor_base) + extras.reduce((sum, item) => sum + Number(item.preco), 0)
      : services.reduce((sum, item) => sum + Number(item.preco), 0);

    return {
      valor_estimado: Number(estimated.toFixed(2)),
      combo_aplicado: selectedCombo?.id_combo_base ?? null,
      services,
    };
  }

  async estimate(data, auth) {
    const result = await this.validateAndPrice(data, auth);
    return { valor_estimado: result.valor_estimado, combo_aplicado: result.combo_aplicado, expira_em_horas: 48 };
  }


  // APOIO POLLYANA | ETAPA 6 — Criação validada; o status inicial Pendente vem do schema Prisma.
  async create(data, auth, inTransaction = false) {
    if (!auth?.id_cliente) throw new ForbiddenError('É necessário um perfil de cliente');
    if (!inTransaction) {
      return this.database.$transaction(async (tx) => {
        await lockDiarista(tx, data.id_diarista);
        return new AgendamentoWorkflowService(tx).create(data, auth, true);
      }, { isolationLevel: 'ReadCommitted' });
    }
    const duplicate = await findDuplicateRequest(this.database, data, auth.id_cliente);
    if (duplicate) {
      throw new ConflictError('Você já possui uma solicitação para esta diarista nessa data e horário. Acompanhe o pedido em Minhas diárias, sem enviar outra solicitação.');
    }
    const pricing = await this.validateAndPrice(data, auth);
    const expira_em = new Date(Date.now() + 48 * 60 * 60 * 1000);
    const appointment = await this.database.agendamento.create({
      data: {
        id_cliente: auth.id_cliente,
        id_diarista: data.id_diarista,
        id_endereco: data.id_endereco,
        id_combo_base: pricing.combo_aplicado,
        data_agendamento: data.data_agendamento,
        horario_inicio: data.horario_inicio,
        horario_fim: data.horario_fim,
        qtd_comodos: data.qtd_comodos,
        tamanho_residencia: data.tamanho_residencia,
        valor_estimado: pricing.valor_estimado,
        observacoes: data.observacoes,
        expira_em,
        agendamento_servico: {
          create: pricing.services.map((item) => ({
            preco: item.preco,
            diarista_servico_id_diarista_servico: item.id_diarista_servico,
          })),
        },
      },
      include: agendamentoInclude,
    });
    return present(appointment);
  }

  async list({ page = 1, limit = 20, status, visao = 'todos' } = {}, auth) {
    await this.expirePending();
    if (!auth?.id_cliente && !auth?.id_diarista) throw new ForbiddenError('É necessário um perfil de cliente ou diarista');
    const today = currentLocalDate();
    const viewFilters = {
      todos: {},
      solicitacoes: { status: 'Pendente', ...(auth.id_diarista ? { id_diarista: auth.id_diarista } : {}) },
      futuros: { data_agendamento: { gte: today }, status: { in: ['Pendente', 'Aceito', 'Em_andamento'] } },
      historico: { status: { in: ['Cancelado', 'Recusado', 'Expirado', 'Concluido'] } },
    };
    const where = {
      OR: [
        ...(auth.id_cliente ? [{ id_cliente: auth.id_cliente }] : []),
        ...(auth.id_diarista ? [{ id_diarista: auth.id_diarista }] : []),
      ],
      ...viewFilters[visao],
      ...(status ? { status } : {}),
    };
    const [data, total] = await Promise.all([
      this.database.agendamento.findMany({ where, include: agendamentoInclude, skip: (page - 1) * limit, take: limit, orderBy: [{ data_agendamento: 'desc' }, { horario_inicio: 'desc' }] }),
      this.database.agendamento.count({ where }),
    ]);
    return { data: data.map(present), pagination: { page, limit, total, pages: Math.ceil(total / limit) } };
  }

  async find(id, auth) {
    await this.expirePending();
    const appointment = await this.database.agendamento.findUnique({ where: { id_agendamento: Number(id) }, include: agendamentoInclude });
    if (appointment && !isParticipant(appointment, auth)) throw new ForbiddenError('Agendamento não pertence ao usuário autenticado');
    return appointment ? present(appointment) : null;
  }

  async updateNotes(id, data, auth) {
    const appointment = await this.find(id, auth);
    if (!appointment) throw new NotFoundError('Agendamento não encontrado');
    if (!['Pendente', 'Aceito'].includes(appointment.status)) throw new ConflictError('Agendamento não permite mais alterações');
    return present(await this.database.agendamento.update({ where: { id_agendamento: Number(id) }, data, include: agendamentoInclude }));
  }

  async accept(id, auth) {
    await this.expirePending();
    if (!auth?.id_diarista) throw new ForbiddenError('É necessário um perfil de diarista');
    return this.database.$transaction(async (tx) => {
      await lockDiarista(tx, auth.id_diarista);
      await tx.$queryRaw`SELECT id_agendamento FROM agendamento WHERE id_agendamento = ${Number(id)} FOR UPDATE`;
      const appointment = await tx.agendamento.findUnique({ where: { id_agendamento: Number(id) } });
      if (!appointment) throw new NotFoundError('Agendamento não encontrado');
      if (appointment.id_diarista !== auth.id_diarista) throw new ForbiddenError('Solicitação destinada a outra diarista');
      if (appointment.status !== 'Pendente') throw new ConflictError('Solicitação não está pendente');
      if (appointment.expira_em && appointment.expira_em <= new Date()) throw new ConflictError('Solicitação expirada');
      if (!appointment.horario_inicio || !appointment.horario_fim) throw new BadRequestError('Agendamento legado sem intervalo de horário');

      const conflict = await findBookingConflict(tx, appointment, appointment.id_agendamento);
      if (conflict) throw new ConflictError('Já existe outro agendamento aceito nesse horário');

      const updated = await tx.agendamento.update({
        where: { id_agendamento: appointment.id_agendamento },
        data: { status: 'Aceito', respondido_em: new Date() },
        include: agendamentoInclude,
      });
      return present(updated);
    }, { isolationLevel: 'ReadCommitted' });
  }

  async reject(id, auth) {
    await this.expirePending();
    const appointment = await this.database.agendamento.findUnique({ where: { id_agendamento: Number(id) } });
    if (!appointment) throw new NotFoundError('Agendamento não encontrado');
    if (appointment.id_diarista !== auth?.id_diarista) throw new ForbiddenError('Solicitação destinada a outra diarista');
    if (appointment.status !== 'Pendente') throw new ConflictError('Solicitação não está pendente');
    return present(await this.database.agendamento.update({ where: { id_agendamento: appointment.id_agendamento }, data: { status: 'Recusado', respondido_em: new Date() }, include: agendamentoInclude }));
  }

  async cancel(id, auth, descricao = null) {
    return this.database.$transaction(async (tx) => {
      // A mesma trava usada pelo pagamento e check-in impede cancelar uma diária já iniciada.
      await tx.$queryRaw`SELECT id_agendamento FROM agendamento WHERE id_agendamento = ${Number(id)} FOR UPDATE`;
      const appointment = await tx.agendamento.findUnique({ where: { id_agendamento: Number(id) } });
      if (!appointment) throw new NotFoundError('Agendamento não encontrado');
      if (!isParticipant(appointment, auth)) throw new ForbiddenError('Agendamento não pertence ao usuário autenticado');
      if (!['Pendente', 'Aceito'].includes(appointment.status)) throw new ConflictError('Agendamento não pode ser cancelado');
      const updated = await tx.agendamento.update({ where: { id_agendamento: Number(id) }, data: { status: 'Cancelado', respondido_em: new Date() }, include: agendamentoInclude });
      // Estorno integral autorizado: a chamada externa ocorre depois, em uma fila com repetição segura.
      await tx.pagamento_transacao.updateMany({
        where: { status: 'approved', parcela: { id_agendamento: Number(id) } },
        data: { estorno_pendente: true },
      });
      await tx.pagamento_parcela.updateMany({
        where: { id_agendamento: Number(id), status: 'Pago' }, data: { status: 'Estorno_pendente' },
      });
      await tx.ocorrencia_agendamento.create({ data: { id_agendamento: Number(id), motivo: 'cancelamento', descricao } });
      return present(updated);
    });
  }
}

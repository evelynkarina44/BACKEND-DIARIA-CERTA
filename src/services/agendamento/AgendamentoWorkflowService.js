import prisma from '../../lib/prisma.js';
import { BadRequestError, ConflictError, ForbiddenError, NotFoundError } from '../../errors/index.js';
import { combineDateAndTime, currentLocalDate } from '../../utils/dateTime.js';

const agendamentoInclude = {
  cliente: { include: { usuario: { select: { nome: true, foto_perfil: true, telefone: true } } } },
  diarista: { include: { usuario: { select: { nome: true, foto_perfil: true, telefone: true } } } },
  combo_base: { select: { id_combo_base: true, nome_combo: true, valor_base: true } },
  endereco: true,
  agendamento_servico: { include: { diarista_servico: { include: { servico: true } } } },
  checkin_checkout: true,
  ocorrencia_agendamento: { orderBy: { data_ocorrencia: 'desc' } },
};

function isParticipant(appointment, auth) {
  return appointment.id_cliente === auth?.id_cliente || appointment.id_diarista === auth?.id_diarista;
}

function present(appointment) {
  return {
    ...appointment,
    valor_estimado: appointment.valor_estimado === null ? null : Number(appointment.valor_estimado),
    combo_base: appointment.combo_base ? { ...appointment.combo_base, valor_base: Number(appointment.combo_base.valor_base) } : null,
    agendamento_servico: appointment.agendamento_servico?.map((item) => ({ ...item, preco: Number(item.preco) })) ?? [],
  };
}

export class AgendamentoWorkflowService {
  async expirePending() {
    return prisma.agendamento.updateMany({
      where: { status: 'Pendente', expira_em: { lte: new Date() } },
      data: { status: 'Expirado', respondido_em: new Date() },
    });
  }

  async validateAndPrice(data, auth) {
    if (!auth?.id_cliente) throw new ForbiddenError('É necessário um perfil de cliente');

    const [diarista, endereco, services, availabilitySlots] = await Promise.all([
      prisma.diarista.findUnique({
        where: { id_diarista: data.id_diarista },
        include: {
          combo_base: {
            where: { ativo: true },
            select: {
              id_combo_base: true,
              valor_base: true,
              qtd_comodos_casa: true,
              atende_casa_pequena: true,
              atende_casa_media: true,
              atende_casa_grande: true,
              combo_servico: { select: { id_servico: true } },
            },
          },
        },
      }),
      prisma.endereco.findUnique({ where: { id_endereco: data.id_endereco } }),
      prisma.diarista_servico.findMany({
        where: { id_diarista_servico: { in: data.servicos.map((item) => item.id_diarista_servico) } },
      }),
      prisma.disponibilidade_diarista.findMany({
        where: {
          id_diarista: data.id_diarista,
          dia_semana: data.data_agendamento,
          disponivel: true,
        },
      }),
    ]);

    if (!diarista) throw new NotFoundError('Diarista não encontrada');
    if (diarista.id_usuario === auth.id_usuario) throw new BadRequestError('Não é possível agendar o próprio perfil de diarista');
    if (!endereco || endereco.id_cliente !== auth.id_cliente) throw new ForbiddenError('Endereço não pertence ao cliente autenticado');
    if (services.length !== new Set(data.servicos.map((item) => item.id_diarista_servico)).size || services.some((item) => item.id_diarista !== data.id_diarista)) {
      throw new BadRequestError('Um ou mais serviços não pertencem à diarista selecionada');
    }
    if (data.qtd_comodos > diarista.qtd_max_comodos) throw new BadRequestError('Quantidade de cômodos acima do limite da diarista');
    const requestedStart = data.horario_inicio.toISOString().slice(11, 19);
    const availability = availabilitySlots.find(
      (slot) => slot.horario_inicio.toISOString().slice(11, 19) === requestedStart,
    );
    if (!availability) throw new ConflictError('Horário de início não está disponível para a data selecionada');

    const startsAt = combineDateAndTime(data.data_agendamento, data.horario_inicio);
    if (startsAt <= new Date()) throw new BadRequestError('O agendamento deve ser futuro');

    const sizeField = `atende_casa_${data.tamanho_residencia}`;
    const selectedCombo = data.id_combo_base
      ? diarista.combo_base.find((combo) => combo.id_combo_base === data.id_combo_base)
      : null;
    if (data.id_combo_base && !selectedCombo) throw new BadRequestError('Combo não pertence à diarista ou está inativo');
    if (selectedCombo && (!selectedCombo[sizeField] || data.qtd_comodos > selectedCombo.qtd_comodos_casa)) {
      throw new BadRequestError('Combo incompatível com o tamanho da residência ou quantidade de cômodos');
    }

    const serviceIds = new Set(services.map((item) => item.id_servico));
    const comboServiceIds = new Set(selectedCombo?.combo_servico.map((item) => item.id_servico) ?? []);
    if (selectedCombo && [...comboServiceIds].some((id) => !serviceIds.has(id))) {
      throw new BadRequestError('Inclua todos os serviços pertencentes ao combo selecionado');
    }
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

  async create(data, auth) {
    const pricing = await this.validateAndPrice(data, auth);
    const expira_em = new Date(Date.now() + 48 * 60 * 60 * 1000);
    const appointment = await prisma.agendamento.create({
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
      prisma.agendamento.findMany({ where, include: agendamentoInclude, skip: (page - 1) * limit, take: limit, orderBy: [{ data_agendamento: 'desc' }, { horario_inicio: 'desc' }] }),
      prisma.agendamento.count({ where }),
    ]);
    return { data: data.map(present), pagination: { page, limit, total, pages: Math.ceil(total / limit) } };
  }

  async find(id, auth) {
    await this.expirePending();
    const appointment = await prisma.agendamento.findUnique({ where: { id_agendamento: Number(id) }, include: agendamentoInclude });
    if (appointment && !isParticipant(appointment, auth)) throw new ForbiddenError('Agendamento não pertence ao usuário autenticado');
    return appointment ? present(appointment) : null;
  }

  async updateNotes(id, data, auth) {
    const appointment = await this.find(id, auth);
    if (!appointment) throw new NotFoundError('Agendamento não encontrado');
    if (!['Pendente', 'Aceito'].includes(appointment.status)) throw new ConflictError('Agendamento não permite mais alterações');
    return present(await prisma.agendamento.update({ where: { id_agendamento: Number(id) }, data, include: agendamentoInclude }));
  }

  async accept(id, auth) {
    await this.expirePending();
    if (!auth?.id_diarista) throw new ForbiddenError('É necessário um perfil de diarista');
    return prisma.$transaction(async (tx) => {
      const appointment = await tx.agendamento.findUnique({ where: { id_agendamento: Number(id) } });
      if (!appointment) throw new NotFoundError('Agendamento não encontrado');
      if (appointment.id_diarista !== auth.id_diarista) throw new ForbiddenError('Solicitação destinada a outra diarista');
      if (appointment.status !== 'Pendente') throw new ConflictError('Solicitação não está pendente');
      if (appointment.expira_em && appointment.expira_em <= new Date()) throw new ConflictError('Solicitação expirada');
      if (!appointment.horario_inicio || !appointment.horario_fim) throw new BadRequestError('Agendamento legado sem intervalo de horário');

      const conflict = await tx.agendamento.findFirst({
        where: {
          id_agendamento: { not: appointment.id_agendamento },
          id_diarista: auth.id_diarista,
          data_agendamento: appointment.data_agendamento,
          status: { in: ['Aceito', 'Em_andamento'] },
          horario_inicio: { lt: appointment.horario_fim },
          horario_fim: { gt: appointment.horario_inicio },
        },
      });
      if (conflict) throw new ConflictError('Já existe outro agendamento aceito nesse horário');

      const updated = await tx.agendamento.update({
        where: { id_agendamento: appointment.id_agendamento },
        data: { status: 'Aceito', respondido_em: new Date() },
        include: agendamentoInclude,
      });
      return present(updated);
    });
  }

  async reject(id, auth) {
    await this.expirePending();
    const appointment = await prisma.agendamento.findUnique({ where: { id_agendamento: Number(id) } });
    if (!appointment) throw new NotFoundError('Agendamento não encontrado');
    if (appointment.id_diarista !== auth?.id_diarista) throw new ForbiddenError('Solicitação destinada a outra diarista');
    if (appointment.status !== 'Pendente') throw new ConflictError('Solicitação não está pendente');
    return present(await prisma.agendamento.update({ where: { id_agendamento: appointment.id_agendamento }, data: { status: 'Recusado', respondido_em: new Date() }, include: agendamentoInclude }));
  }

  async cancel(id, auth, descricao = null) {
    const appointment = await this.find(id, auth);
    if (!appointment) throw new NotFoundError('Agendamento não encontrado');
    if (!['Pendente', 'Aceito'].includes(appointment.status)) throw new ConflictError('Agendamento não pode ser cancelado');
    return prisma.$transaction(async (tx) => {
      const updated = await tx.agendamento.update({ where: { id_agendamento: Number(id) }, data: { status: 'Cancelado', respondido_em: new Date() }, include: agendamentoInclude });
      await tx.ocorrencia_agendamento.create({ data: { id_agendamento: Number(id), motivo: 'cancelamento', descricao } });
      return present(updated);
    });
  }
}

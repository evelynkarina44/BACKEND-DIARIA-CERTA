import prisma from '../../lib/prisma.js';
import { ForbiddenError } from '../../errors/index.js';
import { PaymentService } from '../pagamento/PaymentService.js';
import { combineDateAndTime } from '../../utils/dateTime.js';
import { checkinExpirationInfo } from './checkinExpirationPolicy.js';

// Uma consulta paginada carrega o acompanhamento sem consultar o Mercado Pago
// nem fazer uma requisição de pagamento por card. Apenas estados salvos da API.
export class AgendamentoTrackingService {
  constructor(database = prisma, clock = () => new Date()) {
    this.database = database;
    this.clock = clock;
    this.payments = new PaymentService(database);
  }

  async list({ page = 1, limit = 20 } = {}, auth) {
    const customer = auth?.activeProfile === 'CLIENTE' && auth.id_cliente;
    const worker = auth?.activeProfile === 'DIARISTA' && auth.id_diarista;
    if (!customer && !worker) throw new ForbiddenError('Selecione um perfil de cliente ou diarista.');
    const now = this.clock();
    const weekAgo = new Date(now.getTime() - 7 * 86400000);
    const twoDaysAgo = new Date(now.getTime() - 2 * 86400000);
    const where = {
      ...(customer ? { id_cliente: auth.id_cliente } : { id_diarista: auth.id_diarista }),
      OR: [
        { status: { in: ['Pendente', 'Aceito', 'Em_andamento'] } },
        { status: 'Concluido', OR: [
          { concluido_em: { gte: weekAgo } },
          { NOT: { AND: [
            { pagamento_parcela: { some: { fase: 'Entrada', status: 'Pago' } } },
            { pagamento_parcela: { some: { fase: 'Saldo', status: 'Pago' } } },
          ] } },
          ...(customer ? [{ avaliacao: { none: { autor_tipo: 'Cliente' } } }] : []),
        ] },
        { status: { in: ['Recusado', 'Cancelado', 'Expirado'] }, respondido_em: { gte: twoDaysAgo } },
        { pagamento_parcela: { some: { status: { in: ['Estorno_pendente', 'Em_disputa'] } } } },
      ],
    };
    const select = {
      id_agendamento: true, status: true, data_agendamento: true, horario_inicio: true,
      valor_estimado: true, expira_em: true,
      cliente: { select: { usuario: { select: { nome: true, foto_perfil: true } } } },
      diarista: { select: { usuario: { select: { nome: true, foto_perfil: true } } } },
      endereco: { select: { logradouro: true, numero: true, bairro: true, cidade: true, estado: true } },
      agendamento_servico: { select: { diarista_servico: { select: { servico: { select: { nome_servico: true } } } } } },
      checkin_checkout: { select: { horario_checkin: true, horario_checkout: true, status_checkin: true } },
      avaliacao: { where: { autor_tipo: 'Cliente' }, select: { id_avaliacao: true, nota: true, comentario: true } },
      ocorrencia_agendamento: { select: { descricao: true } },
      pagamento_parcela: { include: { transacoes: { select: { estorno_pendente: true } } } },
    };
    const [appointments, total] = await Promise.all([
      this.database.agendamento.findMany({ where, select, skip: (page - 1) * limit, take: limit,
        orderBy: [{ data_agendamento: 'asc' }, { horario_inicio: 'asc' }, { id_agendamento: 'asc' }] }),
      this.database.agendamento.count({ where }),
    ]);
    return {
      data: appointments.map(appointment => ({
        id_agendamento: appointment.id_agendamento,
        status: appointment.status,
        ...checkinExpirationInfo(appointment, now),
        data_agendamento: appointment.data_agendamento,
        horario_inicio: appointment.horario_inicio,
        inicio_em: appointment.horario_inicio ? combineDateAndTime(appointment.data_agendamento, appointment.horario_inicio).toISOString() : null,
        expira_em: appointment.expira_em,
        pessoa: (customer ? appointment.diarista : appointment.cliente)?.usuario ?? null,
        endereco: appointment.endereco,
        servicos: appointment.agendamento_servico.map(item => item.diarista_servico?.servico?.nome_servico).filter(Boolean),
        checkin: appointment.checkin_checkout[0] ?? null,
        pagamento: appointment.valor_estimado != null && Number(appointment.valor_estimado) >= 0.02
          ? this.payments.summary(appointment) : null,
      })),
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
      atualizado_em: now.toISOString(),
    };
  }
}

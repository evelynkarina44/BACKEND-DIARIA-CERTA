import prisma from '../../lib/prisma.js';
import { BadRequestError, ConflictError, ForbiddenError, NotFoundError } from '../../errors/index.js';
import { combineDateAndTime } from '../../utils/dateTime.js';
import { expireCheckinLocked } from '../agendamento/CheckinExpirationService.js';
import { checkinExpired } from '../agendamento/checkinExpirationPolicy.js';

function scheduledAt(appointment) {
  if (!appointment.horario_inicio) return null;
  return combineDateAndTime(appointment.data_agendamento, appointment.horario_inicio);
}

async function appointmentForParticipant(id, auth, database) {
  const appointment = await database.agendamento.findUnique({
    where: { id_agendamento: Number(id) },
    include: { checkin_checkout: true, pagamento_parcela: true, ocorrencia_agendamento: { select: { descricao: true } } },
  });
  if (!appointment) throw new NotFoundError('Agendamento não encontrado');
  if (appointment.id_cliente !== auth?.id_cliente && appointment.id_diarista !== auth?.id_diarista) {
    throw new ForbiddenError('Agendamento não pertence ao usuário autenticado');
  }
  return appointment;
}

export class CheckinCheckoutWorkflowService {
  constructor(database = prisma, clock = () => new Date()) { this.database = database; this.clock = clock; }

  async locked(id, auth, callback) {
    const result = await this.database.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT id_agendamento FROM agendamento WHERE id_agendamento = ${Number(id)} FOR UPDATE`;
      const appointment = await appointmentForParticipant(id, auth, tx);
      if (appointment.status === 'Expirado' && checkinExpired(appointment, this.clock())) return { checkin_expirado: true };
      if (await expireCheckinLocked(tx, appointment, this.clock())) return { checkin_expirado: true };
      return callback(appointment, tx);
    });
    // Não lançar dentro da transação: isso desfaria a expiração e a fila de estorno.
    if (result?.checkin_expirado) throw new ConflictError('Check-in expirado. O prazo de 30 minutos após o horário agendado terminou. A entrada paga será estornada integralmente.');
    return result;
  }

  async requestCheckin(id, auth) {
    return this.locked(id, auth, async (appointment, tx) => {
      if (appointment.id_diarista !== auth?.id_diarista) throw new ForbiddenError('Somente a diarista pode solicitar check-in');
      const check = appointment.checkin_checkout[0];
      if (appointment.status === 'Em_andamento' && check?.status_checkin === 'Iniciado') return check;
      if (appointment.status !== 'Aceito') throw new ConflictError('O agendamento precisa estar aceito');
      if (!appointment.pagamento_parcela.some((item) => item.fase === 'Entrada' && item.status === 'Pago')) {
        throw new ConflictError('O cliente precisa pagar a entrada de 50% antes do check-in.');
      }
      const startsAt = scheduledAt(appointment);
      if (!startsAt) throw new BadRequestError('Agendamento legado sem horário definido');
      if (this.clock().getTime() < startsAt.getTime()) throw new ConflictError('Check-in disponível a partir do horário agendado.');
      if (check && !['N_o_iniciado', 'Checkin_solicitado', 'Aguardando_pagamento'].includes(check.status_checkin)) {
        throw new ConflictError('Check-in já realizado');
      }
      // A diarista registra o início real; isso não aprova nem cobra pagamentos.
      const data = { status_checkin: 'Iniciado', status_pagamento: 'Pendente', horario_checkin: this.clock() };
      const updated = check
        ? await tx.checkin_checkout.update({ where: { id_check: check.id_check }, data })
        : await tx.checkin_checkout.create({ data: { id_agendamento: appointment.id_agendamento, ...data } });
      await tx.agendamento.update({ where: { id_agendamento: appointment.id_agendamento }, data: { status: 'Em_andamento' } });
      return updated;
    });
  }

  async confirmPayment(id, auth) {
    // Mantém o endpoint antigo como confirmação de presença, nunca como prova de pagamento.
    return this.locked(id, auth, async (appointment, tx) => {
      if (appointment.id_cliente !== auth?.id_cliente) throw new ForbiddenError('Somente o cliente pode confirmar o pagamento');
      const existingCheck = appointment.checkin_checkout[0];
      if (appointment.status === 'Em_andamento' && existingCheck?.status_checkin === 'Iniciado') return existingCheck;
      if (appointment.status !== 'Aceito') throw new ConflictError('O agendamento precisa estar aceito');
      if (!appointment.pagamento_parcela.some((item) => item.fase === 'Entrada' && item.status === 'Pago')) {
        throw new ConflictError('A entrada de 50% ainda não foi aprovada pelo Mercado Pago.');
      }
      const check = appointment.checkin_checkout[0];
      if (!check || !['Checkin_solicitado', 'Aguardando_pagamento'].includes(check.status_checkin)) {
        throw new ConflictError('Não existe solicitação de check-in aguardando pagamento');
      }
      const startsAt = scheduledAt(appointment);
      if (!startsAt || this.clock().getTime() < startsAt.getTime()) throw new ConflictError('Check-in disponível a partir do horário agendado.');
      const updated = await tx.checkin_checkout.update({
        where: { id_check: check.id_check },
        data: { status_checkin: 'Iniciado', status_pagamento: 'Pendente', horario_checkin: this.clock() },
      });
      await tx.agendamento.update({ where: { id_agendamento: appointment.id_agendamento }, data: { status: 'Em_andamento' } });
      return updated;
    });
  }

  async checkout(id, auth) {
    return this.locked(id, auth, async (appointment, tx) => {
      if (appointment.id_diarista !== auth?.id_diarista) throw new ForbiddenError('Somente a diarista pode realizar o check-out');
      const check = appointment.checkin_checkout[0];
      if (appointment.status === 'Concluido' && check?.horario_checkout) return check;
      if (appointment.status !== 'Em_andamento' || !check || check.status_checkin !== 'Iniciado') {
        throw new ConflictError('O serviço ainda não foi iniciado');
      }
      const updated = await tx.checkin_checkout.update({
        where: { id_check: check.id_check },
        data: { status_checkin: 'Finalizado', horario_checkout: this.clock() },
      });
      await tx.agendamento.update({
        where: { id_agendamento: appointment.id_agendamento },
        data: { status: 'Concluido', concluido_em: this.clock() },
      });
      return updated;
    });
  }

  async findByAppointment(id, auth) {
    const appointment = await appointmentForParticipant(id, auth, this.database);
    return appointment.checkin_checkout[0] ?? null;
  }
}

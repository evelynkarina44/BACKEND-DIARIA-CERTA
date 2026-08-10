import prisma from '../../lib/prisma.js';
import { BadRequestError, ConflictError, ForbiddenError, NotFoundError } from '../../errors/index.js';
import { combineDateAndTime } from '../../utils/dateTime.js';

function scheduledAt(appointment) {
  if (!appointment.horario_inicio) return null;
  return combineDateAndTime(appointment.data_agendamento, appointment.horario_inicio);
}

async function appointmentForParticipant(id, auth) {
  const appointment = await prisma.agendamento.findUnique({
    where: { id_agendamento: Number(id) },
    include: { checkin_checkout: true },
  });
  if (!appointment) throw new NotFoundError('Agendamento não encontrado');
  if (appointment.id_cliente !== auth?.id_cliente && appointment.id_diarista !== auth?.id_diarista) {
    throw new ForbiddenError('Agendamento não pertence ao usuário autenticado');
  }
  return appointment;
}

export class CheckinCheckoutWorkflowService {
  async requestCheckin(id, auth) {
    const appointment = await appointmentForParticipant(id, auth);
    if (appointment.id_diarista !== auth?.id_diarista) throw new ForbiddenError('Somente a diarista pode solicitar check-in');
    if (appointment.status !== 'Aceito') throw new ConflictError('O agendamento precisa estar aceito');
    const startsAt = scheduledAt(appointment);
    if (!startsAt) throw new BadRequestError('Agendamento legado sem horário definido');
    if (Date.now() < startsAt.getTime() - 60 * 60 * 1000) throw new ConflictError('Check-in disponível somente uma hora antes do serviço');

    const check = appointment.checkin_checkout[0];
    if (check && check.status_checkin !== 'N_o_iniciado') throw new ConflictError('Check-in já solicitado');
    return check
      ? prisma.checkin_checkout.update({ where: { id_check: check.id_check }, data: { status_checkin: 'Checkin_solicitado' } })
      : prisma.checkin_checkout.create({ data: { id_agendamento: appointment.id_agendamento, status_checkin: 'Checkin_solicitado' } });
  }

  async confirmPayment(id, auth) {
    const appointment = await appointmentForParticipant(id, auth);
    if (appointment.id_cliente !== auth?.id_cliente) throw new ForbiddenError('Somente o cliente pode confirmar o pagamento');
    const check = appointment.checkin_checkout[0];
    if (!check || !['Checkin_solicitado', 'Aguardando_pagamento'].includes(check.status_checkin)) {
      throw new ConflictError('Não existe solicitação de check-in aguardando pagamento');
    }
    return prisma.$transaction(async (tx) => {
      const updated = await tx.checkin_checkout.update({
        where: { id_check: check.id_check },
        data: { status_checkin: 'Iniciado', status_pagamento: 'Pago', pagamento_em: new Date(), horario_checkin: new Date() },
      });
      await tx.agendamento.update({ where: { id_agendamento: appointment.id_agendamento }, data: { status: 'Em_andamento' } });
      return updated;
    });
  }

  async checkout(id, auth) {
    const appointment = await appointmentForParticipant(id, auth);
    if (appointment.id_diarista !== auth?.id_diarista) throw new ForbiddenError('Somente a diarista pode realizar o check-out');
    const check = appointment.checkin_checkout[0];
    if (!check || check.status_checkin !== 'Iniciado' || check.status_pagamento !== 'Pago') {
      throw new ConflictError('O serviço ainda não foi iniciado e pago');
    }
    return prisma.$transaction(async (tx) => {
      const updated = await tx.checkin_checkout.update({
        where: { id_check: check.id_check },
        data: { status_checkin: 'Finalizado', horario_checkout: new Date() },
      });
      await tx.agendamento.update({
        where: { id_agendamento: appointment.id_agendamento },
        data: { status: 'Concluido', concluido_em: new Date() },
      });
      return updated;
    });
  }

  async findByAppointment(id, auth) {
    const appointment = await appointmentForParticipant(id, auth);
    return appointment.checkin_checkout[0] ?? null;
  }
}

import prisma from '../../lib/prisma.js';
import { BadRequestError, ConflictError, ForbiddenError, NotFoundError } from '../../errors/index.js';
import { combineDateAndTime } from '../../utils/dateTime.js';
import { expireCheckinLocked } from '../agendamento/CheckinExpirationService.js';
import { checkinClosed, confirmationExpired, arrivalRecorded } from '../agendamento/checkinExpirationPolicy.js';

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
      const now = this.clock();
      const expirationError = confirmationExpired(appointment, now)
        ? 'Confirmação do cliente expirada. A chegada foi registrada, mas o início não foi confirmado em 30 minutos. A entrada paga será estornada integralmente.'
        : 'Check-in expirado. A chegada não foi registrada em até 30 minutos após o horário agendado. A entrada paga será estornada integralmente.';
      if (['Expirado', 'Cancelado'].includes(appointment.status) && checkinClosed(appointment, now)) return { expirationError };
      if (await expireCheckinLocked(tx, appointment, now)) return { expirationError };
      return callback(appointment, tx);
    });
    // Não lançar dentro da transação: isso desfaria a expiração e a fila de estorno.
    if (result?.expirationError) throw new ConflictError(result.expirationError);
    return result;
  }

  async requestCheckin(id, auth) {
    return this.locked(id, auth, async (appointment, tx) => {
      if (appointment.id_diarista !== auth?.id_diarista) throw new ForbiddenError('Somente a diarista pode solicitar check-in');
      const check = appointment.checkin_checkout[0];
      if (appointment.status === 'Em_andamento' && check?.status_checkin === 'Iniciado') return check;
      if (appointment.status !== 'Aceito') throw new ConflictError('O agendamento precisa estar aceito');
      const startsAt = scheduledAt(appointment);
      if (!startsAt) throw new BadRequestError('Agendamento legado sem horário definido');
      if (this.clock().getTime() < startsAt.getTime()) throw new ConflictError('Check-in disponível a partir do horário agendado.');
      if (check && !['N_o_iniciado', 'Checkin_solicitado', 'Aguardando_pagamento'].includes(check.status_checkin)) {
        throw new ConflictError('Check-in já realizado');
      }
      if (arrivalRecorded(appointment)) return check;
      // Chegar não inicia o serviço nem comprova pagamento. O cliente confirma depois.
      const arrivalTime = new Date(Math.floor(this.clock().getTime() / 1000) * 1000);
      const data = { status_checkin: 'Checkin_solicitado', status_pagamento: 'Pendente', horario_chegada: arrivalTime };
      const updated = check
        ? await tx.checkin_checkout.update({ where: { id_check: check.id_check }, data })
        : await tx.checkin_checkout.create({ data: { id_agendamento: appointment.id_agendamento, ...data } });
      return updated;
    });
  }

  async confirmPayment(id, auth) {
    return this.confirmCheckin(id, auth);
  }

  async confirmCheckin(id, auth) {
    return this.locked(id, auth, async (appointment, tx) => {
      if (appointment.id_cliente !== auth?.id_cliente) throw new ForbiddenError('Somente o cliente pode confirmar o início');
      const existingCheck = appointment.checkin_checkout[0];
      if (appointment.status === 'Em_andamento' && existingCheck?.status_checkin === 'Iniciado') return existingCheck;
      if (appointment.status !== 'Aceito') throw new ConflictError('O agendamento precisa estar aceito');
      if (!appointment.pagamento_parcela.some((item) => item.fase === 'Entrada' && item.status === 'Pago')) {
        throw new ConflictError('A entrada de 50% ainda não foi aprovada pelo Mercado Pago.');
      }
      const check = appointment.checkin_checkout[0];
      if (!check || !arrivalRecorded(appointment) || !['Checkin_solicitado', 'Aguardando_pagamento'].includes(check.status_checkin)) {
        throw new ConflictError('Aguarde a diarista registrar a chegada antes de confirmar o início.');
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

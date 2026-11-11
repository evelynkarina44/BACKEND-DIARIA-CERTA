import prisma from '../../lib/prisma.js';
import { BadRequestError, ConflictError, ForbiddenError } from '../../errors/index.js';
import { currentLocalDate } from '../../utils/dateTime.js';
import { intervalsOverlap, lockDiarista } from '../agendamento/availabilityPolicy.js';

const dateKey = (date) => date.toISOString().slice(0, 10);
const timeKey = (time) => time.toISOString().slice(11, 16);
const slotKey = (slot) => `${dateKey(slot.dia_semana)}|${timeKey(slot.horario_inicio)}`;

export class SaveMonthlyAvailabilityService {
  constructor(database = prisma) { this.database = database; }

  async execute({ mes, dias, horarios }, auth) {
    if (!auth?.id_diarista) throw new ForbiddenError('É necessário um perfil de diarista');
    const today = currentLocalDate();
    const start = new Date(`${mes}-01T00:00:00Z`);
    const end = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth() + 1, 1));
    if (end <= today || dias.some((day) => day < today)) {
      throw new BadRequestError('Só é possível alterar dias de hoje em diante.');
    }
    const where = { id_diarista: auth.id_diarista, dia_semana: { gte: start > today ? start : today, lt: end } };
    return this.database.$transaction(async (tx) => {
      // Mesma trava da contratação: salvar o mês não pode disputar com um aceite.
      await lockDiarista(tx, auth.id_diarista);
      const current = await tx.disponibilidade_diarista.findMany({ where });
      const desired = dias.flatMap((day) => horarios.map((time) => {
        const inicio = new Date(`1970-01-01T${time}:00Z`);
        return { id_diarista: auth.id_diarista, dia_semana: day, horario_inicio: inicio, horario_fim: new Date(inicio.getTime() + 3600000), disponivel: true };
      }));
      const desiredKeys = new Set(desired.map(slotKey));
      const existingKeys = new Set(current.map(slotKey));
      const removed = current.filter((slot) => !desiredKeys.has(slotKey(slot)));
      const appointments = await tx.agendamento.findMany({ where: {
        id_diarista: auth.id_diarista,
        data_agendamento: where.dia_semana,
        status: { in: ['Aceito', 'Em_andamento'] },
      } });
      const booked = removed.find((slot) => appointments.some((appointment) =>
        dateKey(appointment.data_agendamento) === dateKey(slot.dia_semana) && intervalsOverlap(appointment, slot)));
      if (booked) {
        throw new ConflictError(`O dia ${dateKey(booked.dia_semana).split('-').reverse().join('/')} às ${timeKey(booked.horario_inicio)} possui uma diária aceita ou em andamento. Mantenha esse horário na agenda.`);
      }
      if (removed.length) await tx.disponibilidade_diarista.deleteMany({ where: { id_diarista: auth.id_diarista, id_agenda: { in: removed.map((slot) => slot.id_agenda) } } });
      const added = desired.filter((slot) => !existingKeys.has(slotKey(slot)));
      if (added.length) await tx.disponibilidade_diarista.createMany({ data: added });
      // Horários mantidos conservam ID e estado; qualquer falha desfaz a operação inteira.
      return tx.disponibilidade_diarista.findMany({ where, orderBy: [{ dia_semana: 'asc' }, { horario_inicio: 'asc' }] });
    }, { isolationLevel: 'ReadCommitted', timeout: 15000 });
  }
}

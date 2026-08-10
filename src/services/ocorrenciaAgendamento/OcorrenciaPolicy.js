import prisma from '../../lib/prisma.js';
import { ForbiddenError, NotFoundError } from '../../errors/index.js';

export async function requireAppointmentParticipant(id_agendamento, auth) {
  const appointment = await prisma.agendamento.findUnique({ where: { id_agendamento: Number(id_agendamento) } });
  if (!appointment) throw new NotFoundError('Agendamento não encontrado');
  if (appointment.id_cliente !== auth?.id_cliente && appointment.id_diarista !== auth?.id_diarista) throw new ForbiddenError('Agendamento pertence a outro usuário');
  return appointment;
}

export async function requireOccurrenceOwner(id, auth) {
  const occurrence = await prisma.ocorrencia_agendamento.findUnique({ where: { id_ocorrencia: Number(id) } });
  if (!occurrence) throw new NotFoundError('Ocorrência não encontrada');
  await requireAppointmentParticipant(occurrence.id_agendamento, auth);
  return occurrence;
}

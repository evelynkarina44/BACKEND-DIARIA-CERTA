import { combineDateAndTime } from '../../utils/dateTime.js';

export const CHECKIN_EXPIRATION_REASON = 'Check-in expirado: a diária não foi iniciada nos 30 minutos após o horário agendado.';
export function checkinDeadline(appointment) {
  if (!appointment.data_agendamento || !appointment.horario_inicio) return null;
  const day = new Date(appointment.data_agendamento), time = new Date(appointment.horario_inicio);
  if (!Number.isFinite(day.getTime()) || !Number.isFinite(time.getTime())) return null;
  return new Date(combineDateAndTime(day, time).getTime() + 30 * 60000);
}
export function checkinExpired(appointment, now = new Date()) {
  if (appointment.status === 'Expirado') return appointment.ocorrencia_agendamento?.some(item => item.descricao === CHECKIN_EXPIRATION_REASON) ?? false;
  if (appointment.status !== 'Aceito') return false;
  if (appointment.checkin_checkout?.some(check => check.horario_checkin || ['Iniciado', 'Finalizado'].includes(check.status_checkin))) return false;
  const deadline = checkinDeadline(appointment);
  return Boolean(deadline && now >= deadline);
}
export function checkinExpirationInfo(appointment, now = new Date()) {
  return { checkin_expirado: checkinExpired(appointment, now), checkin_limite_em: checkinDeadline(appointment)?.toISOString() ?? null };
}

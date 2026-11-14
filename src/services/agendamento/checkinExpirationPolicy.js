import { combineDateAndTime } from '../../utils/dateTime.js';

export const CHECKIN_EXPIRATION_REASON = 'Check-in expirado: a diária não foi iniciada nos 30 minutos após o horário agendado.';
export const CLIENT_CONFIRMATION_EXPIRATION_REASON = 'Confirmação do cliente expirada: a diarista registrou a chegada, mas o cliente não confirmou o início em até 30 minutos.';
export function arrivalRecorded(appointment) {
  const check = appointment.checkin_checkout?.[0];
  const arrival = check?.horario_chegada ? new Date(check.horario_chegada) : null;
  const deadline = checkinDeadline(appointment);
  return Boolean(arrival && deadline && Number.isFinite(arrival.getTime())
    && arrival.getTime() >= deadline.getTime() - 30 * 60000 && arrival < deadline);
}
export function confirmationDeadline(appointment) {
  if (!arrivalRecorded(appointment)) return null;
  return new Date(new Date(appointment.checkin_checkout[0].horario_chegada).getTime() + 30 * 60000);
}
export function confirmationExpired(appointment, now = new Date()) {
  if (appointment.status === 'Cancelado') return appointment.ocorrencia_agendamento?.some(item => item.descricao === CLIENT_CONFIRMATION_EXPIRATION_REASON) ?? false;
  if (appointment.status !== 'Aceito' || appointment.checkin_checkout?.some(check => check.horario_checkin || ['Iniciado', 'Finalizado'].includes(check.status_checkin))) return false;
  const deadline = confirmationDeadline(appointment);
  return Boolean(deadline && now >= deadline);
}
export function checkinClosed(appointment, now = new Date()) {
  return checkinExpired(appointment, now) || confirmationExpired(appointment, now);
}
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
  if (arrivalRecorded(appointment)) return false;
  const deadline = checkinDeadline(appointment);
  return Boolean(deadline && now >= deadline);
}
export function checkinExpirationInfo(appointment, now = new Date()) {
  const confirmationExpiredValue = confirmationExpired(appointment, now);
  return {
    checkin_expirado: checkinExpired(appointment, now), checkin_limite_em: checkinDeadline(appointment)?.toISOString() ?? null,
    confirmacao_cliente_expirada: confirmationExpiredValue,
    confirmacao_cliente_limite_em: confirmationDeadline(appointment)?.toISOString() ?? null,
    aguardando_confirmacao_cliente: appointment.status === 'Aceito' && arrivalRecorded(appointment)
      && !confirmationExpiredValue && !appointment.checkin_checkout?.some(check => check.horario_checkin),
  };
}

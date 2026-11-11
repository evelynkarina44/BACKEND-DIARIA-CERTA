const MAX_RESPONSE_MS = 24 * 60 * 60 * 1000;
const answeredStatuses = new Set(['Aceito', 'Recusado', 'Em_andamento', 'Concluido']);

// Somente dados necessários ao cálculo; nunca devolver esses pedidos no perfil público.
export const responseHistoryInclude = {
  where: { status: { not: 'Cancelado' } },
  select: { status: true, solicitado_em: true, respondido_em: true },
};

export function respondsQuickly(appointments = [], now = new Date()) {
  let answered = 0;
  for (const appointment of appointments) {
    if (appointment.status === 'Cancelado') continue;
    if (appointment.status === 'Expirado') return false; // Expiração automática não é resposta.
    const requested = appointment.solicitado_em ? new Date(appointment.solicitado_em).getTime() : NaN;
    if (!Number.isFinite(requested) || requested > now.getTime()) return false;
    if (appointment.status === 'Pendente') {
      if (now.getTime() - requested > MAX_RESPONSE_MS) return false;
      continue;
    }
    if (!answeredStatuses.has(appointment.status)) continue;
    const responded = appointment.respondido_em ? new Date(appointment.respondido_em).getTime() : NaN;
    const elapsed = responded - requested;
    if (!Number.isFinite(elapsed) || elapsed < 0 || elapsed > MAX_RESPONSE_MS || responded > now.getTime()) return false;
    answered++;
  }
  return answered > 0;
}

export function conflictWhere(data, excludeId) {
  return {
    id_diarista: data.id_diarista,
    data_agendamento: data.data_agendamento,
    status: { in: ['Aceito', 'Em_andamento'] },
    ...(excludeId ? { id_agendamento: { not: Number(excludeId) } } : {}),
  };
}

const seconds = (value) => value.getUTCHours() * 3600 + value.getUTCMinutes() * 60 + value.getUTCSeconds();
export function intervalsOverlap(a, b) {
  return Boolean(a.horario_inicio && a.horario_fim && b.horario_inicio && b.horario_fim)
    && seconds(a.horario_inicio) < seconds(b.horario_fim)
    && seconds(a.horario_fim) > seconds(b.horario_inicio);
}

export async function findBookingConflict(database, data, excludeId) {
  // DATE + TIME na mesma condição produzem coerção incorreta no MySQL local.
  // Busca o dia no índice e compara somente o componente de hora em JavaScript.
  const appointments = await database.agendamento.findMany({
    where: conflictWhere(data, excludeId),
    select: { id_agendamento: true, horario_inicio: true, horario_fim: true },
  });
  return appointments.find((appointment) => intervalsOverlap(appointment, data));
}

export async function lockDiarista(database, id) {
  await database.$queryRaw`SELECT id_diarista FROM diarista WHERE id_diarista = ${Number(id)} FOR UPDATE`;
}

export async function findDuplicateRequest(database, data, idCliente) {
  // Consultar depois da trava da diarista: dois envios simultâneos não passam juntos.
  // Compare apenas TIME em JavaScript, evitando a coerção DATE + TIME do MySQL.
  const appointments = await database.agendamento.findMany({
    where: {
      id_cliente: idCliente,
      id_diarista: data.id_diarista,
      data_agendamento: data.data_agendamento,
      OR: [
        { status: { in: ['Aceito', 'Em_andamento'] } },
        { status: 'Pendente', OR: [{ expira_em: null }, { expira_em: { gt: new Date() } }] },
      ],
    },
    select: { id_agendamento: true, horario_inicio: true },
  });
  return appointments.find((item) => item.horario_inicio && seconds(item.horario_inicio) === seconds(data.horario_inicio));
}

export async function syncUsuarioTipo(database, id_usuario) {
  const [cliente, diarista] = await Promise.all([
    database.cliente.findUnique({ where: { id_usuario: Number(id_usuario) }, select: { id_cliente: true } }),
    database.diarista.findUnique({ where: { id_usuario: Number(id_usuario) }, select: { id_diarista: true } }),
  ]);

  const tipo = cliente && diarista
    ? 'AMBOS'
    : cliente
      ? 'CLIENTE'
      : diarista
        ? 'DIARISTA'
        : null;

  if (tipo) {
    await database.usuario.update({ where: { id_usuario: Number(id_usuario) }, data: { tipo } });
  }
  return tipo;
}

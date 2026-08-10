import prisma from '../../lib/prisma.js';
import { ConflictError, ForbiddenError, NotFoundError } from '../../errors/index.js';

function authorType(appointment, auth) {
  if (appointment.id_cliente === auth?.id_cliente) return 'Cliente';
  if (appointment.id_diarista === auth?.id_diarista) return 'Diarista';
  throw new ForbiddenError('Agendamento não pertence ao usuário autenticado');
}

async function refreshDiaristaAverage(tx, id_diarista) {
  const result = await tx.avaliacao.aggregate({
    where: { id_diarista, autor_tipo: 'Cliente' },
    _avg: { nota: true },
  });
  await tx.diarista.update({
    where: { id_diarista },
    data: { avaliacao_media: result._avg.nota },
  });
}

function present(review) {
  const data = { ...review, nota: Number(review.nota) };
  if (review.anonima) {
    delete data.id_cliente;
    delete data.id_diarista;
  }
  return data;
}

export class AvaliacaoWorkflowService {
  async create(data, auth) {
    const appointment = await prisma.agendamento.findUnique({ where: { id_agendamento: data.id_agendamento } });
    if (!appointment) throw new NotFoundError('Agendamento não encontrado');
    if (appointment.status !== 'Concluido') throw new ConflictError('Avaliações são liberadas somente após a conclusão');
    const autor_tipo = authorType(appointment, auth);

    return prisma.$transaction(async (tx) => {
      const review = await tx.avaliacao.create({
        data: {
          id_agendamento: appointment.id_agendamento,
          id_cliente: appointment.id_cliente,
          id_diarista: appointment.id_diarista,
          nota: data.nota,
          comentario: data.comentario,
          comentario_publico: data.publica,
          comentario_privado: !data.publica,
          anonima: data.anonima,
          autor_tipo,
        },
      });
      if (autor_tipo === 'Cliente') await refreshDiaristaAverage(tx, appointment.id_diarista);
      return present(review);
    });
  }

  async list({ page = 1, limit = 20 } = {}, auth) {
    const where = auth
      ? { OR: [{ id_cliente: auth.id_cliente ?? -1 }, { id_diarista: auth.id_diarista ?? -1 }] }
      : { autor_tipo: 'Cliente', comentario_publico: true };
    const [reviews, total] = await Promise.all([
      prisma.avaliacao.findMany({ where, skip: (page - 1) * limit, take: limit, orderBy: { data_avaliacao: 'desc' } }),
      prisma.avaliacao.count({ where }),
    ]);
    return { data: reviews.map(present), pagination: { page, limit, total, pages: Math.ceil(total / limit) } };
  }

  async find(id, auth) {
    const review = await prisma.avaliacao.findUnique({ where: { id_avaliacao: Number(id) } });
    if (!review) return null;
    if (!review.comentario_publico && review.id_cliente !== auth?.id_cliente && review.id_diarista !== auth?.id_diarista) {
      throw new ForbiddenError('Avaliação privada');
    }
    return present(review);
  }

  async update(id, data, auth) {
    const current = await prisma.avaliacao.findUnique({ where: { id_avaliacao: Number(id) }, include: { agendamento: true } });
    if (!current) throw new NotFoundError('Avaliação não encontrada');
    if (authorType(current.agendamento, auth) !== current.autor_tipo) throw new ForbiddenError('Somente o autor pode alterar a avaliação');
    return prisma.$transaction(async (tx) => {
      const review = await tx.avaliacao.update({
        where: { id_avaliacao: Number(id) },
        data: {
          ...(data.nota !== undefined ? { nota: data.nota } : {}),
          ...(data.comentario !== undefined ? { comentario: data.comentario } : {}),
          ...(data.publica !== undefined ? { comentario_publico: data.publica, comentario_privado: !data.publica } : {}),
          ...(data.anonima !== undefined ? { anonima: data.anonima } : {}),
        },
      });
      if (current.autor_tipo === 'Cliente') await refreshDiaristaAverage(tx, current.id_diarista);
      return present(review);
    });
  }

  async delete(id, auth) {
    const current = await prisma.avaliacao.findUnique({ where: { id_avaliacao: Number(id) }, include: { agendamento: true } });
    if (!current) throw new NotFoundError('Avaliação não encontrada');
    if (authorType(current.agendamento, auth) !== current.autor_tipo) throw new ForbiddenError('Somente o autor pode excluir a avaliação');
    return prisma.$transaction(async (tx) => {
      await tx.avaliacao.delete({ where: { id_avaliacao: Number(id) } });
      if (current.autor_tipo === 'Cliente') await refreshDiaristaAverage(tx, current.id_diarista);
    });
  }
}

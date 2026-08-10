import prisma from '../../lib/prisma.js';
import { ForbiddenError } from '../../errors/index.js';

export class DiaristaStatsService {
  async execute(id, auth) {
    const id_diarista = Number(id);
    if (id_diarista !== auth?.id_diarista) throw new ForbiddenError('Estatísticas disponíveis apenas para a própria diarista');
    const [statuses, ratings, answered] = await Promise.all([
      prisma.agendamento.groupBy({ by: ['status'], where: { id_diarista }, _count: { _all: true } }),
      prisma.avaliacao.aggregate({ where: { id_diarista, autor_tipo: 'Cliente' }, _avg: { nota: true }, _count: { nota: true } }),
      prisma.agendamento.findMany({ where: { id_diarista, respondido_em: { not: null } }, select: { solicitado_em: true, respondido_em: true } }),
    ]);
    const totals = Object.fromEntries(statuses.map((item) => [item.status, item._count._all]));
    const responseHours = answered.map((item) => (item.respondido_em - item.solicitado_em) / 3600000);
    const responded = (totals.Aceito ?? 0) + (totals.Recusado ?? 0) + (totals.Cancelado ?? 0) + (totals.Em_andamento ?? 0) + (totals.Concluido ?? 0);
    const expired = totals.Expirado ?? 0;
    return {
      agendamentos_por_status: totals,
      diarias_concluidas: totals.Concluido ?? 0,
      avaliacao_media: ratings._avg.nota === null ? null : Number(ratings._avg.nota),
      total_avaliacoes: ratings._count.nota,
      taxa_resposta: responded + expired ? Number(((responded / (responded + expired)) * 100).toFixed(2)) : null,
      tempo_medio_resposta_horas: responseHours.length ? Number((responseHours.reduce((sum, value) => sum + value, 0) / responseHours.length).toFixed(2)) : null,
    };
  }
}

import { Prisma } from '@prisma/client';
import prisma from '../../lib/prisma.js';
import { ForbiddenError, NotFoundError } from '../../errors/index.js';
import { notificationEvents } from './notificationEvents.js';

export class NotificationService {
  constructor(database = prisma, clock = () => new Date()) { this.database = database; this.clock = clock; }
  scope(auth) {
    if (!auth?.id_usuario) throw new ForbiddenError('Sessão inválida.');
    if (auth.activeProfile === 'CLIENTE' && auth.id_cliente) return { id_cliente: auth.id_cliente };
    if (auth.activeProfile === 'DIARISTA' && auth.id_diarista) return { id_diarista: auth.id_diarista };
    throw new ForbiddenError('Selecione um perfil para consultar notificações.');
  }
  async feed(auth) {
    const scope = this.scope(auth), now = this.clock(), since = new Date(now.getTime() - 30 * 86400000);
    const appointments = await this.database.agendamento.findMany({
      where: { ...scope, OR: [
        { solicitado_em: { gte: since } }, { respondido_em: { gte: since } },
        { checkin_checkout: { some: { OR: [{ horario_checkin: { gte: since } }, { horario_checkout: { gte: since } }] } } },
        { pagamento_parcela: { some: { atualizado_em: { gte: since } } } },
        { avaliacao: { some: { data_avaliacao: { gte: since }, autor_tipo: 'Cliente' } } },
        { status: 'Aceito', data_agendamento: { gte: new Date(since.toISOString().slice(0, 10)) } },
      ] },
      select: {
        id_agendamento: true, status: true, data_agendamento: true, horario_inicio: true, solicitado_em: true, respondido_em: true,
        ocorrencia_agendamento: { select: { descricao: true } },
        checkin_checkout: { select: { horario_chegada: true, horario_checkin: true, horario_checkout: true, status_checkin: true } },
        avaliacao: { where: { autor_tipo: 'Cliente' }, select: { data_avaliacao: true } },
        pagamento_parcela: { select: { fase: true, status: true, atualizado_em: true, transacoes: { select: {
          status: true, criado_em: true, estorno_pendente: true, estornado_centavos: true, valor_centavos: true,
        } } } },
      },
    });
    const events = appointments.flatMap(a => notificationEvents(a, auth.activeProfile, now)).filter(e => new Date(e.criado_em) >= since)
      .sort((a, b) => b.criado_em.localeCompare(a.criado_em) || a.id.localeCompare(b.id));
    if (!events.length) return { events: [], now };
    // SQL sempre parametrizado. Compatível com o Prisma já carregado no Windows,
    // sem depender de regenerar uma DLL em uso somente para o controle de leitura.
    const rows = await this.database.$queryRaw(Prisma.sql`
      SELECT chave_evento FROM notificacao_leitura
      WHERE id_usuario = ${auth.id_usuario} AND perfil = ${auth.activeProfile}
      AND chave_evento IN (${Prisma.join(events.map(e => e.id))})
    `);
    const read = new Set(rows.map(r => r.chave_evento));
    return { events: events.map(e => ({ ...e, lida: read.has(e.id) })), now };
  }
  async list({ page = 1, limit = 30 } = {}, auth) {
    const { events, now } = await this.feed(auth);
    return { data: events.slice((page - 1) * limit, page * limit), nao_lidas: events.filter(e => !e.lida).length,
      pagination: { page, limit, total: events.length, pages: Math.ceil(events.length / limit) }, atualizado_em: now.toISOString() };
  }
  async markRead(id, auth) {
    const { events } = await this.feed(auth);
    const event = events.find(e => e.id === id);
    if (!event) throw new NotFoundError('Notificação não encontrada.');
    if (!event.lida) await this.saveReads([event.id], auth);
    return { id, lida: true };
  }
  async markAll(auth) {
    const { events } = await this.feed(auth);
    const ids = events.filter(e => !e.lida).map(e => e.id);
    if (ids.length) await this.saveReads(ids, auth);
    return { marcadas: ids.length };
  }
  async saveReads(ids, auth) {
    this.scope(auth);
    const values = ids.map(id => Prisma.sql`(${auth.id_usuario}, ${auth.activeProfile}, ${id}, CURRENT_TIMESTAMP(3))`);
    await this.database.$executeRaw(Prisma.sql`
      INSERT INTO notificacao_leitura (id_usuario, perfil, chave_evento, lida_em)
      VALUES ${Prisma.join(values)} ON DUPLICATE KEY UPDATE lida_em = lida_em
    `);
  }
}

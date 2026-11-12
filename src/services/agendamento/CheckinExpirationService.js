import prisma from '../../lib/prisma.js';
import { currentLocalDate } from '../../utils/dateTime.js';
import { checkinExpired, CHECKIN_EXPIRATION_REASON } from './checkinExpirationPolicy.js';

// Executar sob a trava do agendamento, compartilhada com check-in e pagamento.
export async function expireCheckinLocked(tx, appointment, now) {
  if (appointment.status !== 'Aceito' || !checkinExpired(appointment, now)) return false;
  await tx.agendamento.update({ where: { id_agendamento: appointment.id_agendamento }, data: { status: 'Expirado', respondido_em: now } });
  await tx.ocorrencia_agendamento.create({ data: { id_agendamento: appointment.id_agendamento, motivo: 'outro', descricao: CHECKIN_EXPIRATION_REASON } });
  await tx.pagamento_transacao.updateMany({
    where: { status: 'approved', parcela: { id_agendamento: appointment.id_agendamento, fase: 'Entrada' } },
    data: { estorno_pendente: true },
  });
  await tx.pagamento_parcela.updateMany({
    where: { id_agendamento: appointment.id_agendamento, fase: 'Entrada', status: 'Pago' }, data: { status: 'Estorno_pendente' },
  });
  return true;
}

export class CheckinExpirationService {
  constructor(database = prisma, clock = () => new Date()) { this.database = database; this.clock = clock; }
  async run() {
    const candidates = await this.database.agendamento.findMany({
      where: { status: 'Aceito', data_agendamento: { lte: currentLocalDate() }, horario_inicio: { not: null },
        checkin_checkout: { none: { OR: [{ horario_checkin: { not: null } }, { status_checkin: { in: ['Iniciado', 'Finalizado'] } }] } } },
      select: { id_agendamento: true }, orderBy: [{ data_agendamento: 'asc' }, { horario_inicio: 'asc' }], take: 100,
    });
    for (const item of candidates) {
      await this.database.$transaction(async tx => {
        await tx.$queryRaw`SELECT id_agendamento FROM agendamento WHERE id_agendamento = ${item.id_agendamento} FOR UPDATE`;
        const appointment = await tx.agendamento.findUnique({ where: { id_agendamento: item.id_agendamento }, include: { checkin_checkout: true } });
        if (appointment) await expireCheckinLocked(tx, appointment, this.clock());
      });
    }
  }
}

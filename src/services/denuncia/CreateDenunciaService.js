import { DenunciaRepository } from '../../repositories/denunciaRepository.js';
import prisma from '../../lib/prisma.js';
import { BadRequestError, ConflictError, ForbiddenError, NotFoundError } from '../../errors/index.js';
import { refundablePaidCents } from './refundRequestPolicy.js';
import { denunciaPublicSelect } from './denunciaPublicSelect.js';

export class CreateDenunciaService {
  constructor(repository = new DenunciaRepository(), database = prisma) { this.repository = repository; this.database = database; }
  async execute(data, auth) {
    if (data.id_usuario_denunciado === auth?.id_usuario) throw new BadRequestError('Não é possível denunciar o próprio usuário');
    const report = { motivo: data.motivo, descricao: data.descricao, id_usuario_denunciado: data.id_usuario_denunciado, id_usuario_denunciante: auth.id_usuario };
    if (!data.id_agendamento) {
      if (data.solicita_reembolso) throw new BadRequestError('Vincule a solicitação de reembolso a uma diária.');
      return this.repository.create(report);
    }
    return this.database.$transaction(async tx => {
      await tx.$queryRaw`SELECT id_agendamento FROM agendamento WHERE id_agendamento = ${data.id_agendamento} FOR UPDATE`;
      const appointment = await tx.agendamento.findUnique({ where: { id_agendamento: data.id_agendamento }, include: {
        cliente: { select: { id_usuario: true } }, diarista: { select: { id_usuario: true } }, pagamento_parcela: { include: { transacoes: true } },
      } });
      if (!appointment) throw new NotFoundError('Diária não encontrada.');
      const customer = auth.activeProfile === 'CLIENTE' && auth.id_cliente === appointment.id_cliente;
      const worker = auth.activeProfile === 'DIARISTA' && auth.id_diarista === appointment.id_diarista;
      if (!customer && !worker) throw new ForbiddenError('A diária não pertence ao perfil autenticado.');
      if (data.id_usuario_denunciado !== (customer ? appointment.diarista : appointment.cliente).id_usuario) throw new BadRequestError('O denunciado deve ser o outro participante da diária.');
      let paid = null;
      if (data.solicita_reembolso) {
        paid = refundablePaidCents(appointment);
        if (!paid) throw new ConflictError('Esta diária não possui valores pagos disponíveis para análise de reembolso.');
        const existing = await tx.denuncia.findFirst({ where: { id_agendamento: data.id_agendamento, solicita_reembolso: true, reembolso_status: { in: ['Pendente', 'EmAnalise', 'Aprovado'] } }, select: { id_denuncia: true } });
        if (existing) throw new ConflictError('Já existe uma solicitação de reembolso para esta diária aguardando análise ou processamento.');
      }
      return tx.denuncia.create({ data: { ...report, id_agendamento: data.id_agendamento, solicita_reembolso: Boolean(data.solicita_reembolso), reembolso_status: data.solicita_reembolso ? 'Pendente' : 'NaoSolicitado', reembolso_valor_pago_centavos: paid }, select: denunciaPublicSelect });
    });
  }
}

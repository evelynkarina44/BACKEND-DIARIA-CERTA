import prisma from '../../lib/prisma.js';
import { ForbiddenError } from '../../errors/index.js';
import { UpdateDiaristaServicoService } from '../diaristaServico/UpdateDiaristaServicoService.js';

export class UpdateServicoService {
  async execute(id, data, auth) {
    if (!auth?.id_diarista) throw new ForbiddenError('Selecione o perfil de diarista.');
    const offering = await prisma.diarista_servico.findFirst({
      where: { id_servico: Number(id), id_diarista: auth.id_diarista },
    });
    if (!offering) throw new ForbiddenError('O serviço não pertence a esta diarista.');
    const updated = await new UpdateDiaristaServicoService().execute(offering.id_diarista_servico, data, auth);
    return updated.servico;
  }
}

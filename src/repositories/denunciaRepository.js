import prisma from '../lib/prisma.js';
import { BaseRepository } from './BaseRepository.js';
import { ConflictError } from '../errors/index.js';
import { denunciaPublicSelect } from '../services/denuncia/denunciaPublicSelect.js';

export class DenunciaRepository extends BaseRepository {
  constructor() {
    super(prisma.denuncia, 'id_denuncia');
  }
  async updatePending(id, versao, data) {
    return prisma.$transaction(async tx => {
      const result = await tx.denuncia.updateMany({ where: { id_denuncia: Number(id), status: 'Pendente', versao }, data: { ...data, versao: { increment: 1 } } });
      if (!result.count) throw new ConflictError('Denúncia alterada. Atualize antes de editar.');
      return tx.denuncia.findUnique({ where: { id_denuncia: Number(id) }, select: denunciaPublicSelect });
    });
  }
  async deletePending(id, versao) {
    const result = await prisma.denuncia.deleteMany({ where: { id_denuncia: Number(id), status: 'Pendente', versao } });
    if (!result.count) throw new ConflictError('Denúncia alterada. Atualize antes de remover.');
  }
}

import { DiaristaRepository } from '../../repositories/diaristaRepository.js';
import { ForbiddenError } from '../../errors/index.js';
import prisma from '../../lib/prisma.js';
import { syncUsuarioTipo } from '../usuario/syncUsuarioTipo.js';

export class DeleteDiaristaService {
  constructor(repository = new DiaristaRepository(), database = prisma) { this.repository = repository; this.database = database; }
  async execute(id_diarista, auth) {
    if (Number(id_diarista) !== auth?.id_diarista) throw new ForbiddenError('Acesso permitido apenas ao próprio perfil');
    return this.database.$transaction(async (tx) => {
      const deleted = await tx.diarista.delete({ where: { id_diarista: Number(id_diarista) } });
      await syncUsuarioTipo(tx, deleted.id_usuario);
      return deleted;
    });
  }
}

import { DenunciaRepository } from '../../repositories/denunciaRepository.js';
import { ForbiddenError, NotFoundError, ConflictError } from '../../errors/index.js';

export class UpdateDenunciaService {
  constructor(repository = new DenunciaRepository()) { this.repository = repository; }
  async execute(id, data, auth) {
    const current = await this.repository.findById(id);
    if (!current) throw new NotFoundError('Denúncia não encontrada');
    if (current.id_usuario_denunciante !== auth?.id_usuario) throw new ForbiddenError('Denúncia pertence a outro usuário');
    if (current.status !== 'Pendente') throw new ConflictError('Uma denúncia em análise não pode ser editada.');
    return this.repository.updatePending(id, current.versao, data);
  }
}

import { DenunciaRepository } from '../../repositories/denunciaRepository.js';
import { ForbiddenError } from '../../errors/index.js';
import { denunciaPublicSelect } from './denunciaPublicSelect.js';

export class FindDenunciaService {
  constructor(repository = new DenunciaRepository()) { this.repository = repository; }
  async execute(id, auth) { const result = await this.repository.findById(id, { select: denunciaPublicSelect }); if (result && result.id_usuario_denunciante !== auth?.id_usuario) throw new ForbiddenError('Denúncia pertence a outro usuário'); return result; }
}

import { DiaristaRepository } from '../../repositories/diaristaRepository.js';
import { ForbiddenError } from '../../errors/index.js';

export class DeleteDiaristaService {
  constructor(repository = new DiaristaRepository()) { this.repository = repository; }
  execute(id_diarista, auth) {
    if (Number(id_diarista) !== auth?.id_diarista) throw new ForbiddenError('Acesso permitido apenas ao próprio perfil');
    return this.repository.delete(id_diarista);
  }
}

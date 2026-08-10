import { DiaristaRepository } from '../../repositories/diaristaRepository.js';
import { ConflictError, ForbiddenError } from '../../errors/index.js';

export class CreateDiaristaService {
  constructor(repository = new DiaristaRepository()) { this.repository = repository; }
  async execute(data, auth) {
    if (data.id_usuario !== auth?.id_usuario) throw new ForbiddenError('O perfil deve pertencer ao usuário autenticado');
    if (await this.repository.findByIdUsuario(data.id_usuario)) throw new ConflictError('Usuário já possui perfil de diarista');
    return this.repository.create({ ...data, avaliacao_media: null });
  }
}

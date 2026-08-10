import { DenunciaRepository } from '../../repositories/denunciaRepository.js';
import { BadRequestError } from '../../errors/index.js';

export class CreateDenunciaService {
  constructor(repository = new DenunciaRepository()) { this.repository = repository; }
  execute(data, auth) {
    if (data.id_usuario_denunciado === auth?.id_usuario) throw new BadRequestError('Não é possível denunciar o próprio usuário');
    return this.repository.create({ ...data, id_usuario_denunciante: auth.id_usuario });
  }
}

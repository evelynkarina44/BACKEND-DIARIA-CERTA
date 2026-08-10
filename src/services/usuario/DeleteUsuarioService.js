import { UserRepository } from '../../repositories/userRepository.js';
import { ForbiddenError } from '../../errors/index.js';

export class DeleteUsuarioService {
  constructor(repository = new UserRepository()) { this.repository = repository; }
  execute(id_usuario, auth) {
    if (Number(id_usuario) !== auth?.id_usuario) throw new ForbiddenError('Acesso permitido apenas ao próprio usuário');
    return this.repository.delete(id_usuario);
  }
}

import { UserRepository } from '../../repositories/userRepository.js';
import { ForbiddenError } from '../../errors/index.js';
import { usuarioPublicSelect } from './usuarioSelect.js';

export class FindUsuarioService {
  constructor(repository = new UserRepository()) { this.repository = repository; }
  execute(id_usuario, auth) {
    if (auth && Number(id_usuario) !== auth.id_usuario) throw new ForbiddenError('Acesso permitido apenas ao próprio usuário');
    return this.repository.findById(id_usuario, { select: usuarioPublicSelect });
  }
}

import bcrypt from 'bcryptjs';
import { UserRepository } from '../../repositories/userRepository.js';
import { ConflictError, ForbiddenError } from '../../errors/index.js';
import { usuarioPublicSelect } from './usuarioSelect.js';

export class UpdateUsuarioService {
  constructor(repository = new UserRepository()) { this.repository = repository; }
  async execute(id_usuario, data, auth) {
    if (Number(id_usuario) !== auth?.id_usuario) throw new ForbiddenError('Acesso permitido apenas ao próprio usuário');
    const changes = { ...data };
    if (changes.email) {
      changes.email = changes.email.toLowerCase();
      const existing = await this.repository.findByEmail(changes.email);
      if (existing && existing.id_usuario !== Number(id_usuario)) throw new ConflictError('E-mail já cadastrado');
    }
    if (changes.senha) changes.senha = await bcrypt.hash(changes.senha, 12);
    return this.repository.update(id_usuario, changes, { select: usuarioPublicSelect });
  }
}

import bcrypt from 'bcryptjs';
import { UserRepository } from '../../repositories/userRepository.js';
import { ConflictError } from '../../errors/index.js';
import { usuarioPublicSelect } from './usuarioSelect.js';

export class CreateUsuarioService {
  constructor(repository = new UserRepository()) {
    this.repository = repository;
  }

  async execute(data) {
    const email = data.email.toLowerCase();
    if (await this.repository.findByEmail(email)) {
      throw new ConflictError('E-mail já cadastrado');
    }
    return this.repository.create({
      ...data,
      email,
      senha: await bcrypt.hash(data.senha, 12),
    }, { select: usuarioPublicSelect });
  }
}

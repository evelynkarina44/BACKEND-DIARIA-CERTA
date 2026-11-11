import bcrypt from 'bcryptjs';
import { UserRepository } from '../../repositories/userRepository.js';
import { CheckUsuarioAvailabilityService } from './CheckUsuarioAvailabilityService.js';
import { usuarioPublicSelect } from './usuarioSelect.js';

export class CreateUsuarioService {
  constructor(repository = new UserRepository()) {
    this.repository = repository;
  }

  async execute(data) {
    const email = data.email.toLowerCase();
    await new CheckUsuarioAvailabilityService(this.repository).execute({ email, cpf: data.cpf });
    return this.repository.create({
      ...data,
      email,
      senha: await bcrypt.hash(data.senha, 12),
    }, { select: usuarioPublicSelect });
  }
}

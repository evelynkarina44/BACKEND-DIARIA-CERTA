import { UserRepository } from '../../repositories/userRepository.js';
import { usuarioPublicSelect } from './usuarioSelect.js';

export class ListUsuariosService {
  constructor(repository = new UserRepository()) { this.repository = repository; }
  async execute({ page = 1, limit = 20 } = {}, auth) {
    const where = auth ? { id_usuario: auth.id_usuario } : { id_usuario: -1 };
    const [data, total] = await Promise.all([
      this.repository.findAll({ where, select: usuarioPublicSelect, skip: (page - 1) * limit, take: limit }),
      this.repository.count(where),
    ]);
    return { data, pagination: { page, limit, total, pages: Math.ceil(total / limit) } };
  }
}

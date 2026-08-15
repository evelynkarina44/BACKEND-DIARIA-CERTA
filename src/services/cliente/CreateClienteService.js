import { ClienteRepository } from '../../repositories/clienteRepository.js';
import { ConflictError, ForbiddenError } from '../../errors/index.js';

export class CreateClienteService {
  constructor(repository = new ClienteRepository()) { this.repository = repository; }
  async execute(data, auth) {
    if (data.id_usuario !== auth?.id_usuario) throw new ForbiddenError('O perfil deve pertencer ao usuário autenticado');
    if (await this.repository.findByIdUsuario(data.id_usuario)) throw new ConflictError('Usuário já possui perfil de cliente');
    const { endereco, ...cliente } = data;
    return this.repository.create({
      ...cliente,
      endereco: { create: endereco },
    }, { include: { endereco: true } });
  }
}

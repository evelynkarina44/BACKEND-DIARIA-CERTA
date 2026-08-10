import { ClienteRepository } from '../../repositories/clienteRepository.js';
import { ForbiddenError } from '../../errors/index.js';

export class FindClienteService {
  constructor(repository = new ClienteRepository()) { this.repository = repository; }
  execute(id_cliente, auth) {
    if (Number(id_cliente) !== auth?.id_cliente) throw new ForbiddenError('Acesso permitido apenas ao próprio perfil');
    return this.repository.findById(id_cliente);
  }
}

import { EnderecoRepository } from '../../repositories/enderecoRepository.js';
import { ForbiddenError } from '../../errors/index.js';
import { assertEnderecoOwner, assertRequestedOwner } from './EnderecoPolicy.js';

export class UpdateEnderecoService {
  constructor(repository = new EnderecoRepository()) { this.repository = repository; }
  async execute(id, data, auth) {
    const current = await this.repository.findById(id);
    assertEnderecoOwner(current, auth);
    assertRequestedOwner(data, auth);
    if ((data.id_cliente !== undefined && data.id_cliente !== current.id_cliente)
      || (data.id_diarista !== undefined && data.id_diarista !== current.id_diarista)) {
      throw new ForbiddenError('Não é permitido transferir o endereço para outro perfil.');
    }
    return this.repository.update(id, data);
  }
}

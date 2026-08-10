import { EnderecoRepository } from '../../repositories/enderecoRepository.js';
import { assertEnderecoOwner, assertRequestedOwner } from './EnderecoPolicy.js';

export class UpdateEnderecoService {
  constructor(repository = new EnderecoRepository()) { this.repository = repository; }
  async execute(id, data, auth) { const current = await this.repository.findById(id); assertEnderecoOwner(current, auth); assertRequestedOwner(data, auth); return this.repository.update(id, data); }
}

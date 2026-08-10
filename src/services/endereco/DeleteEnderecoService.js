import { EnderecoRepository } from '../../repositories/enderecoRepository.js';
import { assertEnderecoOwner } from './EnderecoPolicy.js';

export class DeleteEnderecoService {
  constructor(repository = new EnderecoRepository()) { this.repository = repository; }
  async execute(id, auth) { const current = await this.repository.findById(id); assertEnderecoOwner(current, auth); return this.repository.delete(id); }
}

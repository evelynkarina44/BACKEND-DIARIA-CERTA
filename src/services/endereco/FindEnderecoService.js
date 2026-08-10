import { EnderecoRepository } from '../../repositories/enderecoRepository.js';
import { assertEnderecoOwner } from './EnderecoPolicy.js';

export class FindEnderecoService {
  constructor(repository = new EnderecoRepository()) { this.repository = repository; }
  async execute(id, auth) { const result = await this.repository.findById(id); if (result) assertEnderecoOwner(result, auth); return result; }
}

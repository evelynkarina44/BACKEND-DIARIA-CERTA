import { EnderecoRepository } from '../../repositories/enderecoRepository.js';
import { assertRequestedOwner } from './EnderecoPolicy.js';

export class CreateEnderecoService {
  constructor(repository = new EnderecoRepository()) { this.repository = repository; }
  execute(data, auth) { assertRequestedOwner(data, auth); return this.repository.create(data); }
}

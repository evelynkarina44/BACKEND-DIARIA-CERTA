import { EnderecoRepository } from "../../repositories/enderecoRepository";

const enderecoRepository = new EnderecoRepository();

export class UpdateEnderecoService {
  async execute(id, data) {
    return enderecoRepository.update(id, data);
  }
}
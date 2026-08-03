import { EnderecoRepository } from "../../repositories/enderecoRepository";

const enderecoRepository = new EnderecoRepository();

export class FindEnderecoService {
  async execute(id) {
    return enderecoRepository.findById(id);
  }
}
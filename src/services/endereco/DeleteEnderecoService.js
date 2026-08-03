import { EnderecoRepository } from "../../repositories/enderecoRepository";

const enderecoRepository = new EnderecoRepository();

export class DeleteEnderecoService {
  async execute(id) {
    return enderecoRepository.delete(id);
  }
}
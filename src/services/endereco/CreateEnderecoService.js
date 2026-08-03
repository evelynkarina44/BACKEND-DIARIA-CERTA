import { EnderecoRepository } from "../../repositories/enderecoRepository";

const enderecoRepository = new EnderecoRepository();

export class CreateEnderecoService {
  async execute(data) {
    return enderecoRepository.create(data);
  }
}
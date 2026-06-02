import { EnderecoRepository } from "../../repositories/enderecoRepository";

const enderecoRepository = new EnderecoRepository();

export class ListEnderecosService {
  async execute() {
    return enderecoRepository.findAll();
  }
}
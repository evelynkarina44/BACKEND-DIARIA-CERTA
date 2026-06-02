import { ClienteRepository } from "../../repositories/clienteRepository";

const clienteRepository = new ClienteRepository();

export class FindClienteService {
  async execute(id) {
    return clienteRepository.findById(id);
  }
}
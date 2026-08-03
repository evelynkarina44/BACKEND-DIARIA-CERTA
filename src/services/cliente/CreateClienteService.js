import { ClienteRepository } from "../../repositories/clienteRepository";

const clienteRepository = new ClienteRepository();

export class CreateClienteService {
  async execute(data) {
    return clienteRepository.create(data);
  }
}
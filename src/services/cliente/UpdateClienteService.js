import { ClienteRepository } from "../../repositories/clienteRepository";

const clienteRepository = new ClienteRepository();

export class UpdateClienteService {
  async execute(id, data) {
    return clienteRepository.update(id, data);
  }
}
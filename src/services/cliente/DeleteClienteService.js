import { ClienteRepository } from "../../repositories/clienteRepository";

const clienteRepository = new ClienteRepository();

export class DeleteClienteService {
  async execute(id) {
    return clienteRepository.delete(id);
  }
}
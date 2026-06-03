import { ClienteRepository } from "../../repositories/clienteRepository";

const clienteRepository = new ClienteRepository();

export class DeleteClienteService {
  async execute(id_cliente) {
    return clienteRepository.delete(id_cliente);
  }
}
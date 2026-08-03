import { ClienteRepository } from "../../repositories/clienteRepository";

const clienteRepository = new ClienteRepository();

export class FindClienteService {
  async execute(id_cliente) {
    return clienteRepository.findById(id_cliente);
  }
}
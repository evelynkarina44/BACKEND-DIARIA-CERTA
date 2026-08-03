import { ClienteRepository } from "../../repositories/clienteRepository";

const clienteRepository = new ClienteRepository();

export class UpdateClienteService {
  async execute(id_cliente, data) {
    return clienteRepository.update(id_cliente, data);
  }
}
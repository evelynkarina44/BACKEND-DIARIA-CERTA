import { ClienteRepository } from "../../repositories/clienteRepository";

const clienteRepository = new ClienteRepository();

export class ListClientesService {
  async execute() {
    return clienteRepository.findAll();
  }
}
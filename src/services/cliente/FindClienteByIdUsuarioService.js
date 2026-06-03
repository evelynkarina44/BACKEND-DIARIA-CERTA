import { ClienteRepository } from "../../repositories/clienteRepository";

const clienteRepository = new ClienteRepository();

export class FindClienteByIdUsuarioService {
  async execute(id_usuario) {
    return clienteRepository.findByIdUsuario(id_usuario);
  }
}
import { DiaristaRepository } from "../../repositories/diaristaRepository";

const diaristaRepository = new DiaristaRepository();

export class FindDiaristaByIdUsuarioService {
  async execute(id_usuario) {
    return diaristaRepository.findByIdUsuario(id_usuario);
  }
}
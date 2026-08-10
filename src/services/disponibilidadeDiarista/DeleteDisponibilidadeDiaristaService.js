import { DisponibilidadeDiaristaRepository } from "../../repositories/disponibilidadeDiaristaRepository.js";

const disponibilidadeDiaristaRepository = new DisponibilidadeDiaristaRepository();

export class DeleteDisponibilidadeDiaristaService {
  async execute(id) {
    return disponibilidadeDiaristaRepository.delete(id);
  }
}
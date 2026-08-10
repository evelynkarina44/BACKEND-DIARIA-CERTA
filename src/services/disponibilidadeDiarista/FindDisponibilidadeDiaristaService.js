import { DisponibilidadeDiaristaRepository } from "../../repositories/disponibilidadeDiaristaRepository.js";

const disponibilidadeDiaristaRepository = new DisponibilidadeDiaristaRepository();

export class FindDisponibilidadeDiaristaService {
  async execute(id) {
    return disponibilidadeDiaristaRepository.findById(id);
  }
}
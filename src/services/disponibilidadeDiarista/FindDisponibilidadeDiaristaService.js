import { DisponibilidadeDiaristaRepository } from "../../repositories/disponibilidadeDiaristaRepository";

const disponibilidadeDiaristaRepository = new DisponibilidadeDiaristaRepository();

export class FindDisponibilidadeDiaristaService {
  async execute(id) {
    return disponibilidadeDiaristaRepository.findById(id);
  }
}
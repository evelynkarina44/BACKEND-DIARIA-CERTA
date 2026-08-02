import { DisponibilidadeDiaristaRepository } from "../../repositories/disponibilidadeDiaristaRepository";

const disponibilidadeDiaristaRepository = new DisponibilidadeDiaristaRepository();

export class UpdateDisponibilidadeDiaristaService {
  async execute(id, data) {
    return disponibilidadeDiaristaRepository.update(id, data);
  }
}
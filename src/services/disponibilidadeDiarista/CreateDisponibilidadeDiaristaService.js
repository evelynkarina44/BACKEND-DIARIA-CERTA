import { DisponibilidadeDiaristaRepository } from "../../repositories/disponibilidadeDiaristaRepository";

const disponibilidadeDiaristaRepository = new DisponibilidadeDiaristaRepository();

export class CreateDisponibilidadeDiaristaService {
  async execute(data) {
    return disponibilidadeDiaristaRepository.create(data);
  }
}
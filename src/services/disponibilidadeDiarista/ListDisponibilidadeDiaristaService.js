import { DisponibilidadeDiaristaRepository } from "../../repositories/disponibilidadeDiaristaRepository.js";

const disponibilidadeDiaristaRepository = new DisponibilidadeDiaristaRepository();

export class ListDisponibilidadeDiaristaService {
  async execute() {
    return disponibilidadeDiaristaRepository.findAll();
  }
}
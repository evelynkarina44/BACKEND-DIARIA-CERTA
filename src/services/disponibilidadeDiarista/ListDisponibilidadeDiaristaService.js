import { DisponibilidadeDiaristaRepository } from "../../repositories/disponibilidadeDiaristaRepository";

const disponibilidadeDiaristaRepository = new DisponibilidadeDiaristaRepository();

export class ListDisponibilidadeDiaristaService {
  async execute() {
    return disponibilidadeDiaristaRepository.findAll();
  }
}
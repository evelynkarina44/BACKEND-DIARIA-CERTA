import { DisponibilidadeDiaristaRepository } from "../../repositories/disponibilidadeDiaristaRepository";

const disponibilidadeDiaristaRepository = new DisponibilidadeDiaristaRepository();

export class DeleteDisponibilidadeDiaristaService {
  async execute(id) {
    return disponibilidadeDiaristaRepository.delete(id);
  }
}
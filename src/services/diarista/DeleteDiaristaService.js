import { DiaristaRepository } from "../../repositories/diaristaRepository";

const diaristaRepository = new DiaristaRepository();

export class DeleteDiaristaService {
  async execute(id_diarista) {
    return diaristaRepository.delete(id_diarista);
  }
}
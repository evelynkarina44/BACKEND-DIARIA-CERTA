import { DiaristaRepository } from "../../repositories/diaristaRepository";

const diaristaRepository = new DiaristaRepository();

export class FindDiaristaService {
  async execute(id_diarista) {
    return diaristaRepository.findById(id_diarista);
  }
}
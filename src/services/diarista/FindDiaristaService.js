import { DiaristaRepository } from "../../repositories/diaristaRepository";

const diaristaRepository = new DiaristaRepository();

export class FindDiaristaService {
  async execute(id) {
    return diaristaRepository.findById(id);
  }
}
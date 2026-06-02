import { DiaristaRepository } from "../../repositories/diaristaRepository";

const diaristaRepository = new DiaristaRepository();

export class UpdateDiaristaService {
  async execute(id, data) {
    return diaristaRepository.update(id, data);
  }
}
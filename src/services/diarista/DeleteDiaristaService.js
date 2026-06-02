import { DiaristaRepository } from "../../repositories/diaristaRepository";

const diaristaRepository = new DiaristaRepository();

export class DeleteDiaristaService {
  async execute(id) {
    return diaristaRepository.delete(id);
  }
}
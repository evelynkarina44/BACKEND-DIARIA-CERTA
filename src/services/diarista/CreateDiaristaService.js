import { DiaristaRepository } from "../../repositories/diaristaRepository";

const diaristaRepository = new DiaristaRepository();

export class CreateDiaristaService {
  async execute(data) {
    return diaristaRepository.create(data);
  }
}
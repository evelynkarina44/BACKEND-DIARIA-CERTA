import { DiaristaRepository } from "../../repositories/diaristaRepository";

const diaristaRepository = new DiaristaRepository();

export class ListDiaristasService {
  async execute() {
    return diaristaRepository.findAll();
  }
}
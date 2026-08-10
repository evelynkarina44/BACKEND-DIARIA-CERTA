import { DiaristaServicoRepository } from "../../repositories/diaristaServicoRepository.js";

const diaristaServicoRepository = new DiaristaServicoRepository();

export class CreateDiaristaServicoService {
  async execute(data) {
    return diaristaServicoRepository.create(data);
  }
}
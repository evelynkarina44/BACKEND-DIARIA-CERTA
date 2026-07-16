import { DiaristaServicoRepository } from "../../repositories/diaristaServicoRepository";

const diaristaServicoRepository = new DiaristaServicoRepository();

export class CreateDiaristaServicoService {
  async execute(data) {
    return diaristaServicoRepository.create(data);
  }
}
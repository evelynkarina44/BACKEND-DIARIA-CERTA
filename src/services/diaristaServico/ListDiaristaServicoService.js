import { DiaristaServicoRepository } from "../../repositories/diaristaServicoRepository.js";

const diaristaServicoRepository = new DiaristaServicoRepository();

export class ListDiaristaServicosService {
  async execute() {
    return diaristaServicoRepository.findAll();
  }
}
import { DiaristaServicoRepository } from "../../repositories/diaristaServicoRepository";

const diaristaServicoRepository = new DiaristaServicoRepository();

export class ListDiaristaServicosService {
  async execute() {
    return diaristaServicoRepository.findAll();
  }
}
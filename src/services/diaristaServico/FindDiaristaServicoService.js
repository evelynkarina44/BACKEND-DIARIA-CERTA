import { DiaristaServicoRepository } from "../../repositories/diaristaServicoRepository";

const diaristaServicoRepository = new DiaristaServicoRepository();

export class FindDiaristaServicoService {
  async execute(id_diarista_servico) {
    return diaristaServicoRepository.findById(id_diarista_servico);
  }
}
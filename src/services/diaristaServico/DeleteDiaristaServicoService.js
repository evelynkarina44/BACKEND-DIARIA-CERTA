import { DiaristaServicoRepository } from "../../repositories/diaristaServicoRepository";

const diaristaServicoRepository = new DiaristaServicoRepository();

export class DeleteDiaristaServicoService {
  async execute(id_diarista_servico) {
    return diaristaServicoRepository.delete(id_diarista_servico);
  }
}
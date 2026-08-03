import { OcorrenciaAgendamentoRepository } from "../../repositories/ocorrenciaAgendamentoRepository";

const ocorrenciaAgendamentoRepository = new OcorrenciaAgendamentoRepository();

export class FindOcorrenciaAgendamentoService {
  async execute(id) {
    return ocorrenciaAgendamentoRepository.findById(id);
  }
}
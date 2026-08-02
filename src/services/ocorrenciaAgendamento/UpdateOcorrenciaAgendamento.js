import { OcorrenciaAgendamentoRepository } from "../../repositories/ocorrenciaAgendamentoRepository";

const ocorrenciaAgendamentoRepository = new OcorrenciaAgendamentoRepository();

export class UpdateOcorrenciaAgendamentoService {
  async execute(id, data) {
    return ocorrenciaAgendamentoRepository.update(id, data);
  }
}
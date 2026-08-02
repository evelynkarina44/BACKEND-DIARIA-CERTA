import { OcorrenciaAgendamentoRepository } from "../../repositories/ocorrenciaAgendamentoRepository";

const ocorrenciaAgendamentoRepository = new OcorrenciaAgendamentoRepository();

export class DeleteOcorrenciaAgendamentoService {
  async execute(id) {
    return ocorrenciaAgendamentoRepository.delete(id);
  }
}
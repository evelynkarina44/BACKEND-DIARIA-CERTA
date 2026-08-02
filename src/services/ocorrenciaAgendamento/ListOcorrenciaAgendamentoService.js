import { OcorrenciaAgendamentoRepository } from "../../repositories/ocorrenciaAgendamentoRepository";

const ocorrenciaAgendamentoRepository = new OcorrenciaAgendamentoRepository();

export class ListOcorrenciaAgendamentoService {
  async execute() {
    return ocorrenciaAgendamentoRepository.findAll();
  }
}
import { OcorrenciaAgendamentoRepository } from "../../repositories/ocorrenciaAgendamentoRepository";

const ocorrenciaAgendamentoRepository = new OcorrenciaAgendamentoRepository();

export class CreateOcorrenciaAgendamentoService {
  async execute(data) {
    return ocorrenciaAgendamentoRepository.create(data);
  }
}
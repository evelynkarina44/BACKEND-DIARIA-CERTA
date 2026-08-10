import { AgendamentoServicoRepository } from "../../repositories/agendamentoServicoRepository.js";

const agendamentoServicoRepository = new AgendamentoServicoRepository();

export class CreateAgendamentoServicoService {
  async execute(data) {
    return agendamentoServicoRepository.create(data);
  }
}
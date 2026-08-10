import { AgendamentoServicoRepository } from "../../repositories/agendamentoServicoRepository.js";

const agendamentoServicoRepository = new AgendamentoServicoRepository();

export class UpdateAgendamentoServicoService {
  async execute(id, data) {
    return agendamentoServicoRepository.update(id, data);
  }
}
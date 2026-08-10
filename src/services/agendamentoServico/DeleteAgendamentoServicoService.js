import { AgendamentoServicoRepository } from "../../repositories/agendamentoServicoRepository.js";

const agendamentoServicoRepository = new AgendamentoServicoRepository();

export class DeleteAgendamentoServicoService {
  async execute(id) {
    return agendamentoServicoRepository.delete(id);
  }
}
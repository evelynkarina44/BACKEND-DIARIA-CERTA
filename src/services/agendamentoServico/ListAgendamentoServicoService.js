import { AgendamentoServicoRepository } from "../../repositories/agendamentoServicoRepository";

const agendamentoServicoRepository = new AgendamentoServicoRepository();

export class ListAgendamentoServicoService {
  async execute() {
    return agendamentoServicoRepository.findAll();
  }
}
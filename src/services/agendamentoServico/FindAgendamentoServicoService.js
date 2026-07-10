import { AgendamentoServicoRepository } from "../../repositories/agendamentoServicoRepository";

const agendamentoServicoRepository = new AgendamentoServicoRepository();

export class FindAgendamentoServicoService {
  async execute(id) {
    return agendamentoServicoRepository.findById(id);
  }
}
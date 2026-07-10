import { AgendamentoServicoRepository } from "../../repositories/agendamentoServicoRepository";

const agendamentoServicoRepository = new AgendamentoServicoRepository();

export class UpdateAgendamentoServicoService {
  async execute(id, data) {
    return agendamentoServicoRepository.update(id, data);
  }
}
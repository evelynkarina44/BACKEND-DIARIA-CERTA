import { AgendamentoServicoRepository } from "../../repositories/agendamentoServicoRepository";

const agendamentoServicoRepository = new AgendamentoServicoRepository();

export class CreateAgendamentoServicoService {
  async execute(data) {
    return agendamentoServicoRepository.create(data);
  }
}
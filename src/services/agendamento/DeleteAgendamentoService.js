import { AgendamentoRepository } from "../../repositories/agendamentoRepository";

const agendamentoRepository = new AgendamentoRepository();

export class DeleteAgendamentoService {
  async execute(id_agendamento) {
    return agendamentoRepository.delete(id_agendamento);
  }
}
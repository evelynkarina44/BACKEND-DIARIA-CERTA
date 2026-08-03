import { AgendamentoRepository } from "../../repositories/agendamentoRepository";

const agendamentoRepository = new AgendamentoRepository();

export class FindAgendamentoService {
  async execute(id_agendamento) {
    return agendamentoRepository.findById(id_agendamento);
  }
}
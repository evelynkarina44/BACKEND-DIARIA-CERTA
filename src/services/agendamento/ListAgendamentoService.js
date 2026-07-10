import { AgendamentoRepository } from "../../repositories/agendamentoRepository";

const agendamentoRepository = new AgendamentoRepository();

export class ListAgendamentosService {
  async execute() {
    return agendamentoRepository.findAll();
  }
}
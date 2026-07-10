import { AgendamentoRepository } from "../../repositories/agendamentoRepository";

const agendamentoRepository = new AgendamentoRepository();

export class CreateAgendamentoService {
  async execute(data) {
    return agendamentoRepository.create(data);
  }
}
import { AgendamentoRepository } from "../../repositories/agendamentoRepository";

const agendamentoRepository = new AgendamentoRepository();

export class UpdateAgendamentoService {
  async execute(id, data) {
    return agendamentoRepository.update(id, data);
  }
}
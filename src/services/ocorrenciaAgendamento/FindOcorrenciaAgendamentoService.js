import { OcorrenciaAgendamentoRepository } from '../../repositories/ocorrenciaAgendamentoRepository.js';
import { requireAppointmentParticipant } from './OcorrenciaPolicy.js';

export class FindOcorrenciaAgendamentoService {
  constructor(repository = new OcorrenciaAgendamentoRepository()) { this.repository = repository; }
  async execute(id, auth) { const result = await this.repository.findById(id); if (result) await requireAppointmentParticipant(result.id_agendamento, auth); return result; }
}

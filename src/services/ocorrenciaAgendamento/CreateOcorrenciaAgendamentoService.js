import { OcorrenciaAgendamentoRepository } from '../../repositories/ocorrenciaAgendamentoRepository.js';
import { requireAppointmentParticipant } from './OcorrenciaPolicy.js';

export class CreateOcorrenciaAgendamentoService {
  constructor(repository = new OcorrenciaAgendamentoRepository()) { this.repository = repository; }
  async execute(data, auth) { await requireAppointmentParticipant(data.id_agendamento, auth); return this.repository.create(data); }
}

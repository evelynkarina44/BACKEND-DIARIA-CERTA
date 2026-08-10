import { OcorrenciaAgendamentoRepository } from '../../repositories/ocorrenciaAgendamentoRepository.js';
import { requireOccurrenceOwner } from './OcorrenciaPolicy.js';

export class UpdateOcorrenciaAgendamentoService {
  constructor(repository = new OcorrenciaAgendamentoRepository()) { this.repository = repository; }
  async execute(id, data, auth) { await requireOccurrenceOwner(id, auth); return this.repository.update(id, data); }
}

import { OcorrenciaAgendamentoRepository } from '../../repositories/ocorrenciaAgendamentoRepository.js';
import { requireOccurrenceOwner } from './OcorrenciaPolicy.js';

export class DeleteOcorrenciaAgendamentoService {
  constructor(repository = new OcorrenciaAgendamentoRepository()) { this.repository = repository; }
  async execute(id, auth) { await requireOccurrenceOwner(id, auth); return this.repository.delete(id); }
}

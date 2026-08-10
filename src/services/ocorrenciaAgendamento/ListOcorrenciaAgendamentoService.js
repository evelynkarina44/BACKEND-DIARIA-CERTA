import { OcorrenciaAgendamentoRepository } from '../../repositories/ocorrenciaAgendamentoRepository.js';

export class ListOcorrenciaAgendamentoService {
  constructor(repository = new OcorrenciaAgendamentoRepository()) { this.repository = repository; }
  async execute({ page = 1, limit = 20 } = {}, auth) {
    const where = { agendamento: { OR: [{ id_cliente: auth?.id_cliente ?? -1 }, { id_diarista: auth?.id_diarista ?? -1 }] } };
    const [data, total] = await Promise.all([
      this.repository.findAll({ where, skip: (page - 1) * limit, take: limit, orderBy: { data_ocorrencia: 'desc' } }),
      this.repository.count(where),
    ]);
    return { data, pagination: { page, limit, total, pages: Math.ceil(total / limit) } };
  }
}

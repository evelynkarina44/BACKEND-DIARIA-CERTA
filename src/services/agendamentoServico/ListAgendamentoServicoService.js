import { AgendamentoServicoRepository } from '../../repositories/agendamentoServicoRepository.js';

export class ListAgendamentoServicoService {
  constructor(repository = new AgendamentoServicoRepository()) { this.repository = repository; }
  async execute({ page = 1, limit = 20 } = {}, auth) {
    const where = { agendamento: { OR: [{ id_cliente: auth?.id_cliente ?? -1 }, { id_diarista: auth?.id_diarista ?? -1 }] } };
    const [data, total] = await Promise.all([
      this.repository.findAll({ where, include: { diarista_servico: { include: { servico: true } } }, skip: (page - 1) * limit, take: limit }),
      this.repository.count(where),
    ]);
    return { data: data.map((item) => ({ ...item, preco: Number(item.preco) })), pagination: { page, limit, total, pages: Math.ceil(total / limit) } };
  }
}

import { AgendamentoServicoRepository } from '../../repositories/agendamentoServicoRepository.js';
import { ForbiddenError } from '../../errors/index.js';

export class FindAgendamentoServicoService {
  constructor(repository = new AgendamentoServicoRepository()) { this.repository = repository; }
  async execute(id, auth) {
    const result = await this.repository.findById(id, { include: { agendamento: true, diarista_servico: { include: { servico: true } } } });
    if (result && result.agendamento.id_cliente !== auth?.id_cliente && result.agendamento.id_diarista !== auth?.id_diarista) throw new ForbiddenError('Agendamento pertence a outro usuário');
    return result ? { ...result, preco: Number(result.preco) } : null;
  }
}

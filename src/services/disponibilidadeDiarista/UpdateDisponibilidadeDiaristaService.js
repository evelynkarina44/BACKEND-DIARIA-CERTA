import { DisponibilidadeDiaristaRepository } from '../../repositories/disponibilidadeDiaristaRepository.js';
import { BadRequestError, ConflictError, ForbiddenError, NotFoundError } from '../../errors/index.js';

export class UpdateDisponibilidadeDiaristaService {
  constructor(repository = new DisponibilidadeDiaristaRepository()) { this.repository = repository; }
  async execute(id, data, auth) {
    const current = await this.repository.findById(id);
    if (!current) throw new NotFoundError('Disponibilidade não encontrada');
    if (current.id_diarista !== auth?.id_diarista) throw new ForbiddenError('Disponibilidade pertence a outra diarista');
    const merged = { ...current, ...data };
    if (merged.horario_fim <= merged.horario_inicio) throw new BadRequestError('O horário final deve ser posterior ao inicial');
    const overlap = await this.repository.findFirst({ where: { id_agenda: { not: Number(id) }, id_diarista: current.id_diarista, dia_semana: merged.dia_semana, disponivel: true, horario_inicio: { lt: merged.horario_fim }, horario_fim: { gt: merged.horario_inicio } } });
    if (overlap) throw new ConflictError('Já existe uma disponibilidade sobreposta');
    return this.repository.update(id, data);
  }
}

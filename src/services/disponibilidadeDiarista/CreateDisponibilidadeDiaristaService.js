import { DisponibilidadeDiaristaRepository } from '../../repositories/disponibilidadeDiaristaRepository.js';
import { ConflictError, ForbiddenError } from '../../errors/index.js';

export class CreateDisponibilidadeDiaristaService {
  constructor(repository = new DisponibilidadeDiaristaRepository()) { this.repository = repository; }
  async execute(data, auth) {
    if (data.id_diarista !== auth?.id_diarista) throw new ForbiddenError('Disponibilidade deve pertencer à diarista autenticada');
    const overlap = await this.repository.findFirst({ where: { id_diarista: data.id_diarista, dia_semana: data.dia_semana, disponivel: true, horario_inicio: { lt: data.horario_fim }, horario_fim: { gt: data.horario_inicio } } });
    if (overlap) throw new ConflictError('Já existe uma disponibilidade sobreposta');
    return this.repository.create(data);
  }
}

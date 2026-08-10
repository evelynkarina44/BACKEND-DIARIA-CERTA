import prisma from '../lib/prisma.js';
import { BaseRepository } from './BaseRepository.js';

export class AgendamentoServicoRepository extends BaseRepository {
  constructor() {
    super(prisma.agendamento_servico, 'id');
  }
}

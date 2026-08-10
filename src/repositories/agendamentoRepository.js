import prisma from '../lib/prisma.js';
import { BaseRepository } from './BaseRepository.js';

export class AgendamentoRepository extends BaseRepository {
  constructor() {
    super(prisma.agendamento, 'id_agendamento');
  }
}

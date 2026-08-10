import prisma from '../lib/prisma.js';
import { BaseRepository } from './BaseRepository.js';

export class OcorrenciaAgendamentoRepository extends BaseRepository {
  constructor() {
    super(prisma.ocorrencia_agendamento, 'id_ocorrencia');
  }
}

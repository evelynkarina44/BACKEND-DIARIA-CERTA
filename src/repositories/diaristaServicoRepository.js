import prisma from '../lib/prisma.js';
import { BaseRepository } from './BaseRepository.js';

export class DiaristaServicoRepository extends BaseRepository {
  constructor() {
    super(prisma.diarista_servico, 'id_diarista_servico');
  }
}

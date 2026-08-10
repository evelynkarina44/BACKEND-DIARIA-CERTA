import prisma from '../lib/prisma.js';
import { BaseRepository } from './BaseRepository.js';

export class AvaliacaoRepository extends BaseRepository {
  constructor() {
    super(prisma.avaliacao, 'id_avaliacao');
  }
}

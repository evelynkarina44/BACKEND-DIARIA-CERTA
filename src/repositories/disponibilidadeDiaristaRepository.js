import prisma from '../lib/prisma.js';
import { BaseRepository } from './BaseRepository.js';

export class DisponibilidadeDiaristaRepository extends BaseRepository {
  constructor() {
    super(prisma.disponibilidade_diarista, 'id_agenda');
  }
}

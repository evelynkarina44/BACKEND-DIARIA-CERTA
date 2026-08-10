import prisma from '../lib/prisma.js';
import { BaseRepository } from './BaseRepository.js';

export class DiaristaRepository extends BaseRepository {
  constructor() {
    super(prisma.diarista, 'id_diarista');
  }

  findByIdUsuario(id_usuario) {
    return this.model.findUnique({ where: { id_usuario: Number(id_usuario) } });
  }
}

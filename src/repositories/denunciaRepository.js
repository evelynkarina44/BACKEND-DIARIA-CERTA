import prisma from '../lib/prisma.js';
import { BaseRepository } from './BaseRepository.js';

export class DenunciaRepository extends BaseRepository {
  constructor() {
    super(prisma.denuncia, 'id_denuncia');
  }
}

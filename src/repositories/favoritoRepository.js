import prisma from '../lib/prisma.js';
import { BaseRepository } from './BaseRepository.js';

export class FavoritoRepository extends BaseRepository {
  constructor() {
    super(prisma.favorito, 'id_favorito');
  }
}

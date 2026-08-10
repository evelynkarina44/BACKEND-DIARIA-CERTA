import prisma from '../lib/prisma.js';
import { BaseRepository } from './BaseRepository.js';

export class EnderecoRepository extends BaseRepository {
  constructor() {
    super(prisma.endereco, 'id_endereco');
  }
}

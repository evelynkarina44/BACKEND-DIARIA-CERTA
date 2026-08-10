import prisma from '../lib/prisma.js';
import { BaseRepository } from './BaseRepository.js';

export class ServicoRepository extends BaseRepository {
  constructor() {
    super(prisma.servico, 'id_servico');
  }
}

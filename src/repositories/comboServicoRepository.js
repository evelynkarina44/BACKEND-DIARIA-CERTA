import prisma from '../lib/prisma.js';
import { BaseRepository } from './BaseRepository.js';

export class ComboServicoRepository extends BaseRepository {
  constructor() {
    super(prisma.combo_servico, 'id_combo_servico');
  }
}

import prisma from '../lib/prisma.js';
import { BaseRepository } from './BaseRepository.js';

export class ComboBaseRepository extends BaseRepository {
  constructor() {
    super(prisma.combo_base, 'id_combo_base');
  }
}

import prisma from '../lib/prisma.js';
import { BaseRepository } from './BaseRepository.js';

export class CheckinCheckoutRepository extends BaseRepository {
  constructor() {
    super(prisma.checkin_checkout, 'id_check');
  }
}

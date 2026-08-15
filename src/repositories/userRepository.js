import prisma from '../lib/prisma.js';
import { BaseRepository } from './BaseRepository.js';

export class UserRepository extends BaseRepository {
  constructor() {
    super(prisma.usuario, 'id_usuario');
  }

  findByEmail(email) {
    return this.model.findUnique({ where: { email } });
  }

  findByCpf(cpf) {
    return this.model.findFirst({ where: { cpf } });
  }
}

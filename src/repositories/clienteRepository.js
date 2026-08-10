import prisma from '../lib/prisma.js';
import { BaseRepository } from './BaseRepository.js';

export class ClienteRepository extends BaseRepository {
  constructor() {
    super(prisma.cliente, 'id_cliente');
  }

  findByIdUsuario(id_usuario) {
    return this.model.findUnique({ where: { id_usuario: Number(id_usuario) } });
  }
}

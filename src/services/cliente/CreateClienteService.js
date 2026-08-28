import { ClienteRepository } from '../../repositories/clienteRepository.js';
import { ConflictError, ForbiddenError } from '../../errors/index.js';
import prisma from '../../lib/prisma.js';
import { syncUsuarioTipo } from '../usuario/syncUsuarioTipo.js';

export class CreateClienteService {
  constructor(repository = new ClienteRepository(), database = prisma) { this.repository = repository; this.database = database; }
  async execute(data, auth) {
    if (data.id_usuario !== auth?.id_usuario) throw new ForbiddenError('O perfil deve pertencer ao usuário autenticado');
    if (await this.repository.findByIdUsuario(data.id_usuario)) throw new ConflictError('Usuário já possui perfil de cliente');
    const { endereco, ...cliente } = data;
    return this.database.$transaction(async (tx) => {
      const profile = await tx.cliente.create({
        data: { ...cliente, endereco: { create: endereco } },
        include: { endereco: true },
      });
      await syncUsuarioTipo(tx, data.id_usuario);
      return profile;
    });
  }
}

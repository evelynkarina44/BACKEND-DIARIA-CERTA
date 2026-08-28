import { ClienteRepository } from '../../repositories/clienteRepository.js';
import { ForbiddenError } from '../../errors/index.js';
import prisma from '../../lib/prisma.js';
import { syncUsuarioTipo } from '../usuario/syncUsuarioTipo.js';

export class DeleteClienteService {
  constructor(repository = new ClienteRepository(), database = prisma) { this.repository = repository; this.database = database; }
  async execute(id_cliente, auth) {
    if (Number(id_cliente) !== auth?.id_cliente) throw new ForbiddenError('Acesso permitido apenas ao próprio perfil');
    return this.database.$transaction(async (tx) => {
      const deleted = await tx.cliente.delete({ where: { id_cliente: Number(id_cliente) } });
      await syncUsuarioTipo(tx, deleted.id_usuario);
      return deleted;
    });
  }
}

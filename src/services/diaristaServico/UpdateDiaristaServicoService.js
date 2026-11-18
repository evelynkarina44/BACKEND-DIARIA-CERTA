import prisma from '../../lib/prisma.js';
import { ConflictError, ForbiddenError, NotFoundError } from '../../errors/index.js';

export class UpdateDiaristaServicoService {
  constructor(database = prisma) {
    this.database = database;
  }

  async execute(id, data, auth) {
    if (!auth?.id_diarista) throw new ForbiddenError('Selecione o perfil de diarista.');
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        return await this.database.$transaction(async tx => {
          // Serialize edits for one professional, including name-conflict checks.
          await tx.$queryRaw`SELECT id_diarista FROM diarista WHERE id_diarista = ${auth.id_diarista} FOR UPDATE`;
          const current = await tx.diarista_servico.findUnique({
            where: { id_diarista_servico: Number(id) }, include: { servico: true },
          });
          if (!current) throw new NotFoundError('Serviço não encontrado.');
          if (current.id_diarista !== auth.id_diarista) throw new ForbiddenError('O serviço pertence a outra diarista.');

          const nome = data.nome_servico ?? current.servico.nome_servico;
          const descricao = data.descricao === undefined ? current.servico.descricao : data.descricao;
          const changed = nome !== current.servico.nome_servico || descricao !== current.servico.descricao;
          let serviceId = current.id_servico;
          if (changed) {
            const duplicate = await tx.diarista_servico.findFirst({ where: {
              id_diarista: current.id_diarista,
              id_diarista_servico: { not: current.id_diarista_servico },
              servico: { nome_servico: nome },
            } });
            if (duplicate) throw new ConflictError('Você já possui um serviço com esse nome. Edite o serviço existente ou escolha outro nome.');

            // Copy-on-write: never rename shared catalog rows or historical booking services.
            const service = await tx.servico.create({ data: { nome_servico: nome, descricao } });
            serviceId = service.id_servico;
            // Only this professional's combos follow the edited offering.
            await tx.combo_servico.updateMany({
              where: { id_servico: current.id_servico, combo_base: { id_diarista: current.id_diarista } },
              data: { id_servico: serviceId },
            });
          }
          return tx.diarista_servico.update({
            where: { id_diarista_servico: current.id_diarista_servico },
            data: {
              id_servico: serviceId,
              ...(data.preco !== undefined ? { preco: data.preco } : {}),
              ...(data.faz_parte_combo_base !== undefined ? { faz_parte_combo_base: data.faz_parte_combo_base } : {}),
            },
            include: { servico: true },
          });
        }, { isolationLevel: 'Serializable' });
      } catch (error) {
        if (error.code === 'P2034' && attempt < 2) continue;
        throw error;
      }
    }
  }
}

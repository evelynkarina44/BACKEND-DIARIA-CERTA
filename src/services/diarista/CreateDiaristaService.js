import { DiaristaRepository } from '../../repositories/diaristaRepository.js';
import prisma from '../../lib/prisma.js';
import { ForbiddenError, NotFoundError } from '../../errors/index.js';
import { syncUsuarioTipo } from '../usuario/syncUsuarioTipo.js';

export class CreateDiaristaService {
  constructor(repository = new DiaristaRepository(), database = prisma) {
    this.repository = repository;
    this.database = database;
  }
  async execute(data, auth) {
    if (data.id_usuario !== auth?.id_usuario) throw new ForbiddenError('O perfil deve pertencer ao usuário autenticado');
    const existingProfile = await this.repository.findByIdUsuario(data.id_usuario);
    const { endereco, servicos = [], combo_base, ...diarista } = data;
    if (!existingProfile && !servicos.length && !combo_base) {
      return this.database.$transaction(async (tx) => {
        const profile = await tx.diarista.create({
          data: { ...diarista, avaliacao_media: null, endereco: { create: endereco } },
          include: { endereco: true },
        });
        await syncUsuarioTipo(tx, data.id_usuario);
        return profile;
      });
    }

    if (existingProfile) {
      const current = await this.database.diarista.findUnique({
        where: { id_diarista: existingProfile.id_diarista },
        include: {
          endereco: true,
          diarista_servico: { include: { servico: true } },
          combo_base: { include: { combo_servico: { include: { servico: true } } } },
        },
      });
      if (!servicos.length || current.diarista_servico.length || current.combo_base.length) {
        await syncUsuarioTipo(this.database, data.id_usuario);
        return current;
      }
    }

    return this.database.$transaction(async (tx) => {
      const profile = existingProfile
        ? await tx.diarista.update({
          where: { id_diarista: existingProfile.id_diarista },
          data: diarista,
        })
        : await tx.diarista.create({
          data: {
            ...diarista,
            avaliacao_media: null,
            endereco: { create: endereco },
          },
        });

      if (existingProfile) {
        const existingAddress = await tx.endereco.findFirst({
          where: { id_diarista: profile.id_diarista },
        });
        if (!existingAddress) {
          await tx.endereco.create({ data: { ...endereco, id_diarista: profile.id_diarista } });
        }
      }
      const resolvedServices = [];

      for (const item of servicos) {
        let id_servico = item.id_servico;
        if (id_servico) {
          const exists = await tx.servico.findUnique({ where: { id_servico } });
          if (!exists) throw new NotFoundError(`Serviço ${id_servico} não encontrado`);
        } else {
          const created = await tx.servico.create({
            data: { nome_servico: item.nome_servico, descricao: item.descricao ?? null },
          });
          id_servico = created.id_servico;
        }

        await tx.diarista_servico.create({
          data: {
            id_diarista: profile.id_diarista,
            id_servico,
            preco: item.preco,
            faz_parte_combo_base: item.faz_parte_combo_base,
          },
        });
        resolvedServices.push({ id_servico, included: item.faz_parte_combo_base });
      }

      if (combo_base) {
        const combo = await tx.combo_base.create({
          data: { ...combo_base, id_diarista: profile.id_diarista },
        });
        for (const item of resolvedServices.filter((service) => service.included)) {
          await tx.combo_servico.create({
            data: { id_combo_base: combo.id_combo_base, id_servico: item.id_servico },
          });
        }
      }

      await syncUsuarioTipo(tx, data.id_usuario);

      return tx.diarista.findUnique({
        where: { id_diarista: profile.id_diarista },
        include: {
          endereco: true,
          diarista_servico: { include: { servico: true } },
          combo_base: { include: { combo_servico: { include: { servico: true } } } },
        },
      });
    });
  }
}

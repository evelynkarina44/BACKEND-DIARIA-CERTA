import prisma from '../lib/prisma.js';
import { ForbiddenError, NotFoundError } from '../errors/index.js';

export function requireOwnProfileInBody(bodyField, authField) {
  return (req, _res, next) => {
    if (req.body[bodyField] !== req.auth?.[authField]) {
      return next(new ForbiddenError('O recurso deve pertencer ao perfil autenticado'));
    }
    next();
  };
}

export function requireOwnedDiaristaResource(model, idField, ownerResolver = (record) => record.id_diarista) {
  return async (req, _res, next) => {
    try {
      const record = await prisma[model].findUnique({ where: { [idField]: Number(req.params.id) }, ...(model === 'combo_servico' ? { include: { combo_base: true } } : {}) });
      if (!record) throw new NotFoundError('Recurso não encontrado');
      if (ownerResolver(record) !== req.auth?.id_diarista) throw new ForbiddenError('Recurso pertence a outra diarista');
      next();
    } catch (error) {
      next(error);
    }
  };
}

export const ownDiaristaServico = requireOwnedDiaristaResource('diarista_servico', 'id_diarista_servico');
export const ownDisponibilidade = requireOwnedDiaristaResource('disponibilidade_diarista', 'id_agenda');
export const ownComboBase = requireOwnedDiaristaResource('combo_base', 'id_combo_base');
export const ownComboServico = requireOwnedDiaristaResource('combo_servico', 'id_combo_servico', (record) => record.combo_base.id_diarista);

export async function requireOwnComboFromBody(req, _res, next) {
  try {
    if (!req.body.id_combo_base) return next();
    const combo = await prisma.combo_base.findUnique({ where: { id_combo_base: req.body.id_combo_base } });
    if (!combo) throw new NotFoundError('Combo base não encontrado');
    if (combo.id_diarista !== req.auth?.id_diarista) throw new ForbiddenError('Combo base pertence a outra diarista');
    next();
  } catch (error) {
    next(error);
  }
}

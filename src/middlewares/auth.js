import jwt from 'jsonwebtoken';
import prisma from '../lib/prisma.js';
import { ForbiddenError, InternalServerError, UnauthorizedError } from '../errors/index.js';
import { availableProfiles } from '../services/auth/authSession.js';

export async function authenticate(req, _res, next) {
  try {
    const authorization = req.headers.authorization;
    if (!authorization?.startsWith('Bearer ')) {
      throw new UnauthorizedError('Token de acesso ausente');
    }
    if (!process.env.JWT_SECRET) {
      throw new InternalServerError('JWT_SECRET não configurado');
    }

    const token = authorization.slice(7);
    const payload = jwt.verify(token, process.env.JWT_SECRET, {
      issuer: 'diaria-certa-api',
      audience: 'diaria-certa-app',
    });
    const id_usuario = Number(payload.sub);
    const user = await prisma.usuario.findUnique({
      where: { id_usuario },
      select: {
        id_usuario: true,
        ativo: true,
        bloqueado: true,
        cliente: { select: { id_cliente: true } },
        diarista: { select: { id_diarista: true } },
      },
    });

    if (!user || !user.ativo || user.bloqueado) throw new UnauthorizedError('Sessão inválida');

    const profiles = availableProfiles(user);
    const tokenActiveProfile = typeof payload.activeProfile === 'string'
      ? payload.activeProfile.toUpperCase()
      : null;
    const activeProfile = profiles.length === 1
      ? profiles[0]
      : profiles.includes(tokenActiveProfile)
        ? tokenActiveProfile
        : null;

    req.auth = {
      id_usuario: user.id_usuario,
      id_cliente: activeProfile === 'CLIENTE' ? user.cliente[0]?.id_cliente ?? null : null,
      id_diarista: activeProfile === 'DIARISTA' ? user.diarista[0]?.id_diarista ?? null : null,
      roles: profiles.map((profile) => profile.toLowerCase()),
      profiles,
      activeProfile,
    };
    next();
  } catch (error) {
    if (error instanceof UnauthorizedError || error instanceof InternalServerError) return next(error);
    return next(new UnauthorizedError('Token inválido ou expirado'));
  }
}

export function authorizeRoles(...roles) {
  return (req, _res, next) => {
    const activeRole = req.auth?.activeProfile?.toLowerCase();
    if (!activeRole || !roles.includes(activeRole)) {
      return next(new ForbiddenError('Perfil sem permissão para esta operação'));
    }
    next();
  };
}

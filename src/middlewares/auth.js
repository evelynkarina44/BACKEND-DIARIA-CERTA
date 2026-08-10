import jwt from 'jsonwebtoken';
import prisma from '../lib/prisma.js';
import { ForbiddenError, InternalServerError, UnauthorizedError } from '../errors/index.js';

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
        cliente: { select: { id_cliente: true } },
        diarista: { select: { id_diarista: true } },
      },
    });

    if (!user) throw new UnauthorizedError('Sessão inválida');

    req.auth = {
      id_usuario: user.id_usuario,
      id_cliente: user.cliente[0]?.id_cliente ?? null,
      id_diarista: user.diarista[0]?.id_diarista ?? null,
      roles: [
        ...(user.cliente.length ? ['cliente'] : []),
        ...(user.diarista.length ? ['diarista'] : []),
      ],
    };
    next();
  } catch (error) {
    if (error instanceof UnauthorizedError || error instanceof InternalServerError) return next(error);
    return next(new UnauthorizedError('Token inválido ou expirado'));
  }
}

export function authorizeRoles(...roles) {
  return (req, _res, next) => {
    if (!roles.some((role) => req.auth?.roles.includes(role))) {
      return next(new ForbiddenError('Perfil sem permissão para esta operação'));
    }
    next();
  };
}

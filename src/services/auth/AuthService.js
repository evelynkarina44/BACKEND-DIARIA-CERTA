import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { timingSafeEqual } from 'node:crypto';
import prisma from '../../lib/prisma.js';
import { InternalServerError, UnauthorizedError } from '../../errors/index.js';

const publicUserSelect = {
  id_usuario: true,
  nome: true,
  email: true,
  telefone: true,
  foto_perfil: true,
  data_cadastro: true,
  cliente: { select: { id_cliente: true } },
  diarista: { select: { id_diarista: true } },
};

function jwtSecret() {
  if (!process.env.JWT_SECRET) {
    throw new InternalServerError('JWT_SECRET não configurado');
  }
  return process.env.JWT_SECRET;
}

function authPayload(user) {
  return {
    sub: String(user.id_usuario),
    roles: [
      ...(user.cliente.length ? ['cliente'] : []),
      ...(user.diarista.length ? ['diarista'] : []),
    ],
  };
}

export class AuthService {
  async login({ email, senha }) {
    const userWithPassword = await prisma.usuario.findUnique({
      where: { email: email.toLowerCase() },
      include: {
        cliente: { select: { id_cliente: true } },
        diarista: { select: { id_diarista: true } },
      },
    });

    let passwordMatches = false;
    let needsRehash = false;
    if (userWithPassword) {
      if (/^\$2[aby]\$/.test(userWithPassword.senha)) {
        passwordMatches = await bcrypt.compare(senha, userWithPassword.senha);
      } else {
        const supplied = Buffer.from(senha);
        const legacy = Buffer.from(userWithPassword.senha);
        passwordMatches = supplied.length === legacy.length && timingSafeEqual(supplied, legacy);
        needsRehash = passwordMatches;
      }
    }

    if (!userWithPassword || !passwordMatches) {
      throw new UnauthorizedError('E-mail ou senha inválidos');
    }

    if (needsRehash) {
      await prisma.usuario.update({
        where: { id_usuario: userWithPassword.id_usuario },
        data: { senha: await bcrypt.hash(senha, 12) },
      });
    }

    const token = jwt.sign(authPayload(userWithPassword), jwtSecret(), {
      expiresIn: process.env.JWT_EXPIRES_IN || '8h',
      issuer: 'diaria-certa-api',
      audience: 'diaria-certa-app',
    });

    const { senha: _senha, ...user } = userWithPassword;
    return { token, user };
  }

  async me(id_usuario) {
    const user = await prisma.usuario.findUnique({
      where: { id_usuario: Number(id_usuario) },
      select: publicUserSelect,
    });
    if (!user) throw new UnauthorizedError('Sessão inválida');
    return user;
  }
}

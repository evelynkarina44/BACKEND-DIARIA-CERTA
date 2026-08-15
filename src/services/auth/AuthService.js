import bcrypt from 'bcryptjs';
import { timingSafeEqual } from 'node:crypto';
import prisma from '../../lib/prisma.js';
import { ForbiddenError, UnauthorizedError } from '../../errors/index.js';
import { usuarioPublicSelect } from '../usuario/usuarioSelect.js';
import { availableProfiles, buildSessionUser, createAuthSession } from './authSession.js';

export class AuthService {
  constructor(database = prisma) {
    this.database = database;
  }

  async login({ email, senha }) {
    const userWithPassword = await this.database.usuario.findUnique({
      where: { email: email.toLowerCase() },
      select: {
        ...usuarioPublicSelect,
        senha: true,
        ativo: true,
        bloqueado: true,
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

    if (!userWithPassword || !passwordMatches || !userWithPassword.ativo || userWithPassword.bloqueado) {
      throw new UnauthorizedError('E-mail ou senha inválidos');
    }

    if (needsRehash) {
      await this.database.usuario.update({
        where: { id_usuario: userWithPassword.id_usuario },
        data: { senha: await bcrypt.hash(senha, 12) },
      });
    }

    const { senha: _senha, ativo: _ativo, bloqueado: _bloqueado, ...user } = userWithPassword;
    return createAuthSession(user);
  }

  async me(id_usuario, activeProfile = null) {
    const user = await this.database.usuario.findUnique({
      where: { id_usuario: Number(id_usuario) },
      select: usuarioPublicSelect,
    });
    if (!user) throw new UnauthorizedError('Sessão inválida');
    return buildSessionUser(user, activeProfile);
  }

  async selectProfile(id_usuario, profile) {
    const user = await this.database.usuario.findUnique({
      where: { id_usuario: Number(id_usuario) },
      select: usuarioPublicSelect,
    });
    if (!user) throw new UnauthorizedError('Sessão inválida');
    if (!availableProfiles(user).includes(profile)) {
      throw new ForbiddenError('O perfil selecionado não pertence a este usuário');
    }
    return createAuthSession(user, profile);
  }
}

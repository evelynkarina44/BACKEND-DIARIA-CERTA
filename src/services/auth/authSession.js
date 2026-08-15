import jwt from 'jsonwebtoken';
import { InternalServerError } from '../../errors/index.js';

export const PROFILE_CLIENTE = 'CLIENTE';
export const PROFILE_DIARISTA = 'DIARISTA';

export function availableProfiles(user) {
  return [
    ...(user.cliente?.length ? [PROFILE_CLIENTE] : []),
    ...(user.diarista?.length ? [PROFILE_DIARISTA] : []),
  ];
}

export function buildSessionUser(user, requestedActiveProfile = null) {
  const profiles = availableProfiles(user);
  const activeProfile = profiles.length === 1
    ? profiles[0]
    : profiles.includes(requestedActiveProfile)
      ? requestedActiveProfile
      : null;

  return {
    ...user,
    profiles,
    activeProfile,
    requiresProfileSelection: profiles.length > 1 && !activeProfile,
  };
}

function jwtSecret() {
  if (!process.env.JWT_SECRET) {
    throw new InternalServerError('JWT_SECRET não configurado');
  }
  return process.env.JWT_SECRET;
}

export function createAuthSession(user, requestedActiveProfile = null) {
  const sessionUser = buildSessionUser(user, requestedActiveProfile);
  const token = jwt.sign({
    sub: String(user.id_usuario),
    roles: sessionUser.profiles.map((profile) => profile.toLowerCase()),
    profiles: sessionUser.profiles,
    activeProfile: sessionUser.activeProfile,
  }, jwtSecret(), {
    expiresIn: process.env.JWT_EXPIRES_IN || '8h',
    issuer: 'diaria-certa-api',
    audience: 'diaria-certa-app',
  });

  return { token, user: sessionUser };
}

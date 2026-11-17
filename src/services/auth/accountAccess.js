export function accountUnavailable(user, now = new Date()) {
  return !user || !user.ativo || user.bloqueado || Boolean(user.excluido_em) || Boolean(user.suspenso_ate && new Date(user.suspenso_ate) > now);
}
export const availableAccountWhere = (now = new Date()) => ({ ativo: true, bloqueado: false, excluido_em: null, OR: [{ suspenso_ate: null }, { suspenso_ate: { lte: now } }] });

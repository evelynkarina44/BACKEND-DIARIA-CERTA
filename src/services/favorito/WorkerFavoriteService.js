import prisma from '../../lib/prisma.js';
import { BadRequestError, ForbiddenError, NotFoundError } from '../../errors/index.js';
import { accountUnavailable } from '../auth/accountAccess.js';
const include = { cliente: { select: { id_cliente: true, usuario: { select: { nome: true, foto_perfil: true } } } } };
export class WorkerFavoriteService {
 constructor(database = prisma) { this.database = database; }
 owner(auth) {
  if (auth?.activeProfile !== 'DIARISTA' || !auth.id_diarista) throw new ForbiddenError('Selecione o perfil de diarista.');
  return auth.id_diarista;
 }
 async create(data, auth) {
  const worker = this.owner(auth);
  if (!data.id_cliente || data.id_diarista !== undefined) throw new BadRequestError('Informe somente o cliente que deseja favoritar.');
  const customer = await this.database.cliente.findUnique({ where: { id_cliente: data.id_cliente }, select: { id_usuario: true, usuario: { select: { ativo: true, bloqueado: true, suspenso_ate: true, excluido_em: true } } } });
  if (!customer || accountUnavailable(customer.usuario)) throw new NotFoundError('Cliente indisponível.');
  if (customer.id_usuario === auth.id_usuario) throw new BadRequestError('Não é possível favoritar seu próprio perfil.');
  const related = await this.database.agendamento.findFirst({ where: { id_cliente: data.id_cliente, id_diarista: worker }, select: { id_agendamento: true } });
  if (!related) throw new ForbiddenError('Você só pode favoritar clientes das suas diárias.');
  return this.database.favorito_cliente.upsert({ where: { id_diarista_id_cliente: { id_diarista: worker, id_cliente: data.id_cliente } }, create: { id_diarista: worker, id_cliente: data.id_cliente }, update: {}, include });
 }
 async list({ page = 1, limit = 20 } = {}, auth) {
  const where = { id_diarista: this.owner(auth) };
  const [data, total] = await Promise.all([
   this.database.favorito_cliente.findMany({ where, include, skip: (page - 1) * limit, take: limit, orderBy: { id_favorito: 'desc' } }),
   this.database.favorito_cliente.count({ where }),
  ]);
  return { data, pagination: { page, limit, total, pages: Math.ceil(total / limit) } };
 }
 async find(id, auth) {
  const result = await this.database.favorito_cliente.findFirst({ where: { id_favorito: Number(id), id_diarista: this.owner(auth) }, include });
  if (!result) throw new NotFoundError('Favorito não encontrado.');
  return result;
 }
 async delete(id, auth) {
  const result = await this.database.favorito_cliente.deleteMany({ where: { id_favorito: Number(id), id_diarista: this.owner(auth) } });
  if (!result.count) throw new NotFoundError('Favorito não encontrado.');
 }
}

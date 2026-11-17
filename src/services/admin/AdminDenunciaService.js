import prisma from '../../lib/prisma.js';
import { attachmentSelect } from '../media/attachmentMedia.js';
import { BadRequestError, ConflictError, ForbiddenError, NotFoundError } from '../../errors/index.js';

export const denunciaStates = ['Pendente', 'EmAnalise', 'Resolvida', 'Arquivada'];
const person = { id_usuario: true, nome: true, email: true, tipo: true };
const include = {
  usuario_denuncia_id_usuario_denuncianteTousuario: { select: person },
  usuario_denuncia_id_usuario_denunciadoTousuario: { select: person },
};
function present(row) {
  const { usuario_denuncia_id_usuario_denuncianteTousuario: denunciante, usuario_denuncia_id_usuario_denunciadoTousuario: denunciado, ...data } = row;
  return { ...data, denunciante, denunciado };
}
export function requireAdmin(auth) {
  if (auth?.activeProfile !== 'ADMIN' || !auth.profiles?.includes('ADMIN')) throw new ForbiddenError('Acesso restrito à administração.');
}
export class AdminDenunciaService {
  constructor(database = prisma) { this.database = database; }
  async list({ page = 1, limit = 10, status, busca = '' }, auth) {
    requireAdmin(auth);
    const where = { ...(status ? { status } : {}), ...(busca ? { OR: [
      { descricao: { contains: busca } },
      { usuario_denuncia_id_usuario_denuncianteTousuario: { is: { nome: { contains: busca } } } },
      { usuario_denuncia_id_usuario_denunciadoTousuario: { is: { nome: { contains: busca } } } },
      ...(Number.isSafeInteger(Number(busca)) && Number(busca) > 0 ? [{ id_denuncia: Number(busca) }] : []),
    ] } : {}) };
    const [data, total] = await Promise.all([
      this.database.denuncia.findMany({ where, include, orderBy: [{ data_denuncia: 'desc' }, { id_denuncia: 'desc' }], skip: (page - 1) * limit, take: limit }),
      this.database.denuncia.count({ where }),
    ]);
    return { data: data.map(present), pagination: { page, limit, total, pages: Math.ceil(total / limit) } };
  }
  async detail(id, auth, database = this.database) {
    requireAdmin(auth);
    const row = await database.denuncia.findUnique({ where: { id_denuncia: Number(id) }, include: { ...include,
      anexos: { select: attachmentSelect, orderBy: { criado_em: 'asc' } },
      analises: { orderBy: [{ criado_em: 'desc' }, { id_analise: 'desc' }], include: { administrador: { select: { id_usuario: true, nome: true } } } },
    } });
    if (!row) throw new NotFoundError('Denúncia não encontrada.');
    return present(row);
  }
  async analyze(id, { status, observacao, versao, acao = 'Nenhuma', dias_suspensao }, auth) {
    requireAdmin(auth);
    if (!denunciaStates.includes(status) || status === 'Pendente') throw new BadRequestError('Escolha Em análise, Resolvida ou Arquivada.');
    if (!observacao?.trim() || observacao.trim().length > 2000) throw new BadRequestError('Registre uma observação de até 2000 caracteres.');
    if (!['Nenhuma','Suspender','Excluir'].includes(acao)) throw new BadRequestError('Medida inválida.');
    if (acao !== 'Nenhuma' && status !== 'Resolvida') throw new BadRequestError('Medidas só podem ser aplicadas ao concluir a denúncia.');
    if (acao === 'Suspender' && (!Number.isInteger(dias_suspensao) || dias_suspensao < 1 || dias_suspensao > 365)) throw new BadRequestError('Informe de 1 a 365 dias de suspensão.');
    return this.database.$transaction(async tx => {
      const current = await tx.denuncia.findUnique({ where: { id_denuncia: Number(id) }, select: { status: true, id_usuario_denunciado: true } });
      if (!current) throw new NotFoundError('Denúncia não encontrada.');
      if (['Resolvida','Arquivada'].includes(current.status)) throw new ConflictError('Esta denúncia já possui uma decisão final.');
      const updated = await tx.denuncia.updateMany({ where: { id_denuncia: Number(id), versao }, data: { status, versao: { increment: 1 } } });
      if (!updated.count) throw new ConflictError('A denúncia foi alterada ou removida. Atualize antes de salvar.');
      let until = null;
      if (acao !== 'Nenhuma') {
        await tx.$queryRaw`SELECT id_usuario FROM usuario WHERE id_usuario = ${current.id_usuario_denunciado} FOR UPDATE`;
        const user = await tx.usuario.findUnique({ where: { id_usuario: current.id_usuario_denunciado }, select: { id_usuario: true, administrador: true, ativo: true, excluido_em: true, versao_sessao: true, suspenso_ate: true } });
        if (!user || user.administrador || user.id_usuario === auth.id_usuario) throw new ForbiddenError('Não é permitido aplicar medidas nesta conta.');
        if (user.excluido_em || !user.ativo) throw new ConflictError('Esta conta já está encerrada ou inativa.');
        if (acao === 'Suspender' && user.suspenso_ate && new Date(user.suspenso_ate) > new Date()) throw new ConflictError('Esta conta já possui uma suspensão ativa.');
        const pending = await tx.agendamento.count({ where: { AND: [
          { OR: [{ cliente: { id_usuario: user.id_usuario } }, { diarista: { id_usuario: user.id_usuario } }] },
          { OR: [{ status: { in: ['Pendente','Aceito','Em_andamento'] } }, { status: 'Concluido', pagamento_parcela: { some: { status: { not: 'Pago' } } } }, { pagamento_parcela: { some: { transacoes: { some: { estorno_pendente: true } } } } }] },
        ] } });
        if (pending) throw new ConflictError('A conta possui diárias ou pendências financeiras em aberto. Resolva-as antes de aplicar a medida.');
        until = acao === 'Suspender' ? new Date(Date.now() + dias_suspensao * 86400000) : null;
        const changed = await tx.usuario.updateMany({ where: { id_usuario: user.id_usuario, administrador: false, versao_sessao: user.versao_sessao, excluido_em: null }, data: {
          versao_sessao: { increment: 1 }, ...(acao === 'Excluir' ? { ativo: false, excluido_em: new Date(), suspenso_ate: null } : { suspenso_ate: until }),
        } });
        if (!changed.count) throw new ConflictError('A conta foi alterada por outro administrador. Atualize a denúncia.');
      }
      await tx.denuncia_analise.create({ data: { id_denuncia: Number(id), id_administrador: auth.id_usuario, status, observacao: observacao.trim(), acao, dias_suspensao: acao === 'Suspender' ? dias_suspensao : null, suspenso_ate: until } });
      return this.detail(id, auth, tx);
    }, { isolationLevel: 'ReadCommitted' });
  }
}

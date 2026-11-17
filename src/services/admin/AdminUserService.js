import prisma from '../../lib/prisma.js';
import { requireAdmin } from './AdminDenunciaService.js';
const select = { id_usuario: true, nome: true, email: true, telefone: true, tipo: true, data_cadastro: true, ativo: true, bloqueado: true, administrador: true, suspenso_ate: true, excluido_em: true };
export class AdminUserService {
 constructor(database=prisma){this.database=database;}
 async list({page=1,limit=10,busca=''},auth){
  requireAdmin(auth);
  const where=busca?{OR:[{nome:{contains:busca}},{email:{contains:busca}},...(Number.isSafeInteger(Number(busca))&&Number(busca)>0?[{id_usuario:Number(busca)}]:[])]}:{};
  const [data,total,total_usuarios]=await Promise.all([
   this.database.usuario.findMany({where,select,skip:(page-1)*limit,take:limit,orderBy:[{data_cadastro:'desc'},{id_usuario:'desc'}]}),
   this.database.usuario.count({where}),this.database.usuario.count({}),
  ]);
  return {data:data.map(u=>({...u,situacao:u.excluido_em?'Excluída':!u.ativo?'Inativa':u.bloqueado?'Bloqueada':u.suspenso_ate&&new Date(u.suspenso_ate)>new Date()?'Suspensa':'Ativa'})),total_usuarios,pagination:{page,limit,total,pages:Math.ceil(total/limit)}};
 }
}

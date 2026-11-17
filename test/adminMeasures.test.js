import test from 'node:test';
import assert from 'node:assert/strict';
import sharp from 'sharp';
import { AdminDenunciaService } from '../src/services/admin/AdminDenunciaService.js';
import { AdminUserService } from '../src/services/admin/AdminUserService.js';
import { DenunciaAttachmentService, normalizeReportImage } from '../src/services/denuncia/DenunciaAttachmentService.js';
import { accountUnavailable } from '../src/services/auth/accountAccess.js';
import { adminAnalysisSchema } from '../src/routes/adminRoutes.js';
const auth={id_usuario:1,activeProfile:'ADMIN',profiles:['ADMIN']};
function fixture({pending=0,administrator=false,terminal=false}={}){
 const writes=[],history=[];
 const tx={ $queryRaw:async()=>[],denuncia:{findUnique:async()=>({id_denuncia:3,status:terminal?'Resolvida':'EmAnalise',id_usuario_denunciado:9}),updateMany:async()=>({count:1})},
 usuario:{findUnique:async()=>({id_usuario:9,administrador:administrator,ativo:true,versao_sessao:0,excluido_em:null}),updateMany:async args=>{writes.push(args);return{count:1};}},
 agendamento:{count:async()=>pending},denuncia_analise:{create:async args=>history.push(args.data)}};
 return{service:new AdminDenunciaService({$transaction:async fn=>fn(tx)}),writes,history};
}
test('suspensão por dias e exclusão encerram sessões e preservam os registros',async()=>{
 for(const acao of ['Suspender','Excluir']){
 const f=fixture();await f.service.analyze(3,{status:'Resolvida',observacao:'Decisão justificada',versao:0,acao,dias_suspensao:7},auth);
 assert.equal(f.writes.length,1);assert.equal(f.writes[0].data.versao_sessao.increment,1);
 assert.equal(f.history[0].acao,acao);assert.equal(f.history[0].id_administrador,1);
 if(acao==='Suspender'){assert.ok(f.writes[0].data.suspenso_ate>Date.now()+6*86400000);assert.equal(f.history[0].dias_suspensao,7);}
 else{assert.equal(f.writes[0].data.ativo,false);assert.ok(f.writes[0].data.excluido_em instanceof Date);}
 }
});
test('não aplicar medida não altera a conta; pendências e contas administrativas impedem sanções',async()=>{
 const none=fixture();await none.service.analyze(3,{status:'Resolvida',observacao:'Sem medida',versao:0,acao:'Nenhuma'},auth);assert.equal(none.writes.length,0);
 for(const options of [{pending:1},{administrator:true},{terminal:true}]){
 const f=fixture(options);await assert.rejects(f.service.analyze(3,{status:'Resolvida',observacao:'Motivo',versao:0,acao:'Excluir'},auth));
 assert.equal(f.writes.length,0);assert.equal(f.history.length,0);
 }
});
test('suspensão termina automaticamente, mas conta excluída continua indisponível',()=>{
 const base={ativo:true,bloqueado:false};
 assert.equal(accountUnavailable({...base,suspenso_ate:'2026-11-20T00:00:00Z'},new Date('2026-11-19')),true);
 assert.equal(accountUnavailable({...base,suspenso_ate:'2026-11-20T00:00:00Z'},new Date('2026-11-21')),false);
 assert.equal(accountUnavailable({...base,excluido_em:new Date()}),true);
 for(const days of [0,366,1.5])assert.equal(adminAnalysisSchema.safeParse({status:'Resolvida',acao:'Suspender',dias_suspensao:days,observacao:'Motivo',versao:0}).success,false);
});
test('tabela de usuários consulta somente dados necessários e total global, sem senha ou CPF',async()=>{
 const counts=[];let query;
 const service=new AdminUserService({usuario:{findMany:async q=>{query=q;return[];},count:async q=>{counts.push(q);return counts.length===1?2:20;}}});
 const result=await service.list({page:2,limit:10,busca:'nome'},auth);
 assert.equal(result.total_usuarios,20);assert.equal(result.pagination.total,2);assert.equal(query.skip,10);
 assert.equal(query.select.senha,undefined);assert.equal(query.select.cpf,undefined);
 await assert.rejects(service.list({}, {activeProfile:'CLIENTE',profiles:['CLIENTE']}),{statusCode:403});
});
test('anexos são imagens reais, privadas e limitadas a três por denúncia',async()=>{
 const input=await sharp({create:{width:40,height:80,channels:3,background:'white'}}).png().toBuffer();
 const bytes=await normalizeReportImage(input),meta=await sharp(bytes).metadata();
 assert.equal(meta.format,'jpeg');assert.equal(meta.width,40);assert.equal(meta.height,80);
 await assert.rejects(normalizeReportImage(Buffer.from('<svg>arquivo inválido</svg>')));
 let count=0,created=0;
 const tx={denuncia:{findUnique:async()=>({id_usuario_denunciante:2,status:'Pendente',versao:0}),updateMany:async()=>({count:1})},denuncia_anexo:{count:async()=>count,create:async()=>{created++;return{id_anexo:'id'};}}};
 const service=new DenunciaAttachmentService({$transaction:async fn=>fn(tx),...tx});
 await service.upload(3,input,{id_usuario:2});assert.equal(created,1);
 count=3;await assert.rejects(service.upload(3,input,{id_usuario:2}));assert.equal(created,1);
 await assert.rejects(service.upload(3,input,{id_usuario:9}),{statusCode:403});
 await assert.rejects(service.read(3,'image',{id_usuario:9,activeProfile:'CLIENTE',profiles:['CLIENTE']}),{statusCode:403});
});

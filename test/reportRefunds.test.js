import test from 'node:test';
import assert from 'node:assert/strict';
import { CreateDenunciaService } from '../src/services/denuncia/CreateDenunciaService.js';
import { AdminDenunciaService } from '../src/services/admin/AdminDenunciaService.js';
import { createDenunciaSchema, updateDenunciaSchema } from '../src/schemas/apiSchemas.js';
import { refundablePaidCents } from '../src/services/denuncia/refundRequestPolicy.js';
import { adminListSchema } from '../src/routes/adminRoutes.js';
const customer = { id_usuario: 10, id_cliente: 1, activeProfile: 'CLIENTE' };
const admin = { id_usuario: 99, activeProfile: 'ADMIN', profiles: ['ADMIN'] };
const request = { id_agendamento: 4, solicita_reembolso: true, id_usuario_denunciado: 20, motivo: 'outro', descricao: 'Solicito análise do reembolso.' };
function fixture({ paid = true, duplicate = false } = {}) {
 const writes = [], events = [];
 const appointment = { id_agendamento: 4, id_cliente: 1, id_diarista: 2, cliente: { id_usuario: 10 }, diarista: { id_usuario: 20 }, pagamento_parcela: [{ transacoes: paid ? [{ status: 'approved', valor_centavos: 20000, estornado_centavos: 5000 }] : [] }] };
 const tx = { $queryRaw: async () => { events.push('lock'); }, agendamento: { findUnique: async () => { events.push('read'); return appointment; } }, denuncia: {
  findFirst: async () => duplicate ? { id_denuncia: 3 } : null,
  create: async ({ data }) => { writes.push(data); return { id_denuncia: 3, ...data }; },
 } };
 return { service: new CreateDenunciaService({}, { $transaction: async fn => fn(tx) }), writes, events, appointment };
}
test('pedido vinculado à diária registra valores do banco e fica pendente, sem movimentar pagamentos', async () => {
 for (const worker of [false,true]) {
 const auth = worker ? { id_usuario:20,id_diarista:2,activeProfile:'DIARISTA' } : customer;
 const f = fixture(), result = await f.service.execute({ ...request,id_usuario_denunciado:worker?10:20 }, auth);
 assert.equal(result.solicita_reembolso, true); assert.equal(result.reembolso_status, 'Pendente'); assert.equal(result.reembolso_valor_pago_centavos, 15000);
 assert.equal(result.id_agendamento, 4); assert.equal(result.id_usuario_denunciante, auth.id_usuario); assert.deepEqual(f.events, ['lock','read']);
 assert.equal(f.writes.length, 1);
 }
});
test('pessoa ou diarista de outra diária, contraparte falsa, falta de pagamento e pedido duplicado são recusados', async () => {
 for (const [options, data, auth, statusCode] of [
  [{},request,{ ...customer, id_cliente: 999 },403],
  [{},{ ...request, id_usuario_denunciado: 10 },{ id_usuario: 30, id_diarista: 999, activeProfile: 'DIARISTA' },403],
  [{},{ ...request, id_usuario_denunciado: 30 },customer,400],
  [{ paid: false },request,customer,409], [{ duplicate: true },request,customer,409],
  [{ paid: false },{ ...request,id_usuario_denunciado:10 },{ id_usuario:20,id_diarista:2,activeProfile:'DIARISTA' },409],
  [{ duplicate: true },{ ...request,id_usuario_denunciado:10 },{ id_usuario:20,id_diarista:2,activeProfile:'DIARISTA' },409],
 ]) { const f = fixture(options); await assert.rejects(f.service.execute(data,auth),{ statusCode }); assert.equal(f.writes.length,0); }
});
test('denúncia sem reembolso segue disponível a diarista e cliente, sem exigir valores pagos', async () => {
 const f = fixture({ paid: false });
 const result = await f.service.execute({ ...request, solicita_reembolso: false, id_usuario_denunciado: 10 }, { id_usuario: 20, id_diarista: 2, activeProfile: 'DIARISTA' });
 assert.equal(result.solicita_reembolso, false); assert.equal(result.reembolso_status, 'NaoSolicitado');
});
test('validação exige diária e relato, rejeita status/valor/decisão forjados e não deixa trocar pedido na edição', () => {
 assert.equal(createDenunciaSchema.safeParse({ ...request, id_agendamento: undefined }).success,false);
 assert.equal(createDenunciaSchema.safeParse({ ...request, descricao: ' ' }).success,false);
 for (const field of ['reembolso_status','reembolso_valor_pago_centavos','id_usuario_denunciante']) assert.equal(createDenunciaSchema.safeParse({ ...request, [field]: 99 }).success,false);
 assert.equal(updateDenunciaSchema.safeParse({ solicita_reembolso: true }).success,false);
 assert.equal(adminListSchema.parse({ somente_reembolso:'false' }).somente_reembolso,false);
 assert.equal(adminListSchema.parse({ somente_reembolso:'true' }).somente_reembolso,true);
});
test('somente saldo aprovado ainda não estornado nem em fila é elegível', () => {
 assert.equal(refundablePaidCents({ pagamento_parcela:[{ transacoes:[
  { status:'approved',valor_centavos:1000,estornado_centavos:300 },{ status:'pending',valor_centavos:1000 },
  { status:'refunded',valor_centavos:1000 },{ status:'approved',valor_centavos:1000,estorno_pendente:true },
 ] }] }),700);
});
function moderation(refund = true) {
 const writes = [], history = [];
 const tx = { denuncia:{ findUnique:async()=>({ status:'EmAnalise',solicita_reembolso:refund }),updateMany:async q=>{ writes.push(q);return{ count:1 }; } },denuncia_analise:{ create:async q=>history.push(q.data) } };
 return { service:new AdminDenunciaService({ $transaction:async fn=>fn(tx) }),writes,history };
}
test('administrador precisa decidir pedido ao concluir e decisão fica auditada, sem estorno', async () => {
 for (const decisao of ['Aprovado','Negado']) {
  const f = moderation(); await f.service.analyze(3,{ status:'Resolvida',observacao:'Justificativa',versao:0,decisao_reembolso:decisao },admin);
  assert.equal(f.writes[0].data.reembolso_status,decisao); assert.equal(f.history[0].decisao_reembolso,decisao);
  assert.equal(f.history[0].id_administrador,99);
 }
 for (const data of [{ status:'Resolvida' },{ status:'Arquivada',decisao_reembolso:'Aprovado' },{ status:'EmAnalise',decisao_reembolso:'Aprovado' }]) {
  const f = moderation(); await assert.rejects(f.service.analyze(3,{ observacao:'Análise',versao:0,...data },admin),{ statusCode:400 });assert.equal(f.writes.length,0);
 }
 const f = moderation(false); await assert.rejects(f.service.analyze(3,{ status:'Resolvida',observacao:'Motivo',versao:0,decisao_reembolso:'Aprovado' },admin),{ statusCode:400 });
 await assert.rejects(moderation().service.analyze(3,{},customer),{ statusCode:403 });
});

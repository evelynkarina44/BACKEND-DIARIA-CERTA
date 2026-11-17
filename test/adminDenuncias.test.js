import test from 'node:test';
import assert from 'node:assert/strict';
import jwt from 'jsonwebtoken';
import prisma from '../src/lib/prisma.js';
import { authenticate } from '../src/middlewares/auth.js';
import { availableProfiles, buildSessionUser } from '../src/services/auth/authSession.js';
import { AdminDenunciaService } from '../src/services/admin/AdminDenunciaService.js';
import { adminAnalysisSchema, adminListSchema } from '../src/routes/adminRoutes.js';
import { createUsuarioSchema, updateUsuarioSchema } from '../src/schemas/apiSchemas.js';
import { denunciaPublicSelect } from '../src/services/denuncia/denunciaPublicSelect.js';
const admin = { id_usuario: 10, activeProfile: 'ADMIN', profiles: ['ADMIN'] };

test('permissão administrativa vem do banco, não de cadastro ou perfil alegado', async () => {
  assert.deepEqual(availableProfiles({ cliente: [{}], diarista: [] }), ['CLIENTE']);
  assert.deepEqual(availableProfiles({ administrador: true }), ['ADMIN']);
  assert.equal(buildSessionUser({ administrador: true }).activeProfile, 'ADMIN');
  const input = { nome: 'Administrador falso', email: 'fake@example.test', senha: 'password12345678', telefone: '11999999999', tipo: 'CLIENTE', administrador: true };
  assert.equal(createUsuarioSchema.safeParse(input).success, false);
  assert.equal(updateUsuarioSchema.safeParse({ administrador: true }).success, false);
  const original = prisma.usuario.findUnique, secret = process.env.JWT_SECRET;
  process.env.JWT_SECRET = 'admin-test-secret-not-for-production';
  try {
    prisma.usuario.findUnique = async () => ({ id_usuario: 1, ativo: true, bloqueado: false, administrador: false, cliente: [{ id_cliente: 1 }], diarista: [] });
    const token = jwt.sign({ sub: '1', activeProfile: 'ADMIN', profiles: ['ADMIN'], roles: ['admin'] }, process.env.JWT_SECRET, { issuer: 'diaria-certa-api', audience: 'diaria-certa-app' });
    const req = { headers: { authorization: 'Bearer ' + token } };
    await authenticate(req, {}, error => { if (error) throw error; });
    assert.equal(req.auth.activeProfile, 'CLIENTE');
    assert.equal(req.auth.profiles.includes('ADMIN'), false);
  } finally { prisma.usuario.findUnique = original; if (secret === undefined) delete process.env.JWT_SECRET; else process.env.JWT_SECRET = secret; }
});
test('não administradores não consultam, detalham nem analisam denúncias', async () => {
  const service = new AdminDenunciaService({});
  for (const auth of [null, { activeProfile: 'CLIENTE', profiles: ['CLIENTE'] }, { activeProfile: 'ADMIN', profiles: ['CLIENTE'] }]) {
    await assert.rejects(service.list({}, auth), { statusCode: 403 });
    await assert.rejects(service.detail(1, auth), { statusCode: 403 });
    await assert.rejects(service.analyze(1, {}, auth), { statusCode: 403 });
  }
});
test('listagem administrativa filtra e pagina, sem selecionar senha, CPF ou telefone', async () => {
  let query;
  const service = new AdminDenunciaService({ denuncia: {
    findMany: async args => { query = args; return []; }, count: async () => 21,
  } });
  const result = await service.list({ page: 2, limit: 10, status: 'EmAnalise', busca: 'Pessoa' }, admin);
  assert.equal(query.skip, 10); assert.equal(query.take, 10); assert.equal(query.where.status, 'EmAnalise');
  assert.equal(result.pagination.pages, 3); assert.ok(query.where.OR.length >= 3);
  const fields = JSON.stringify(query.include);
  assert.equal(/senha|cpf|telefone/.test(fields), false);
  assert.equal('analises' in denunciaPublicSelect, false);
});
test('análise mantém histórico com autor e usa versão para impedir sobrescrita', async () => {
  const writes = [];
  const tx = { denuncia: {
    updateMany: async args => { writes.push(args); return { count: 1 }; },
    findUnique: async () => ({ id_denuncia: 4, status: 'EmAnalise', versao: 3, analises: [] }),
  }, denuncia_analise: { create: async args => { writes.push(args); } } };
  const service = new AdminDenunciaService({ $transaction: async fn => fn(tx) });
  await service.analyze(4, { status: 'Resolvida', observacao: ' Análise justificada ', versao: 2 }, admin);
  assert.equal(writes[0].where.versao, 2);
  assert.equal(writes[0].data.versao.increment, 1);
  assert.equal(writes[1].data.id_administrador, 10);
  assert.equal(writes[1].data.observacao, 'Análise justificada');
  writes.length = 0; tx.denuncia.updateMany = async () => ({ count: 0 });
  await assert.rejects(service.analyze(4, { status: 'Resolvida', observacao: 'nota', versao: 2 }, admin), { statusCode: 409 });
  assert.equal(writes.length, 0, 'não grava histórico quando há conflito');
});
test('validação exige justificativa, versão e status conhecido e rejeita campos de privilégio', () => {
  assert.equal(adminAnalysisSchema.safeParse({ status: 'Resolvida', observacao: '  ', versao: 0 }).success, false);
  assert.equal(adminAnalysisSchema.safeParse({ status: 'Pendente', observacao: 'nota', versao: 0 }).success, false);
  assert.equal(adminAnalysisSchema.safeParse({ status: 'Resolvida', observacao: 'nota', versao: 0, administrador: true }).success, false);
  assert.equal(adminListSchema.safeParse({ limit: 101 }).success, false);
  assert.equal(adminListSchema.parse({}).page, 1);
});

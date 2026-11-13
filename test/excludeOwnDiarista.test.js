import test, { mock } from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { once } from 'node:events';
import jwt from 'jsonwebtoken';
import prisma from '../src/lib/prisma.js';
import { DiaristaSearchService } from '../src/services/diarista/DiaristaSearchService.js';

const profile = (id, user) => ({ id_diarista: id, id_usuario: user, usuario: { nome: String(id) }, endereco: [], diarista_servico: [], avaliacao: [], combo_base: [], avaliacao_media: null });

test('exclui a própria conta antes de paginar, mesmo com perfil ativo cliente e id_diarista ausente', async () => {
  const profiles = [profile(1, 9), profile(2, 10), profile(3, 11)];
  let query;
  const service = new DiaristaSearchService({
    diarista: {
      findMany: async args => { query = args; return profiles.filter(item => item.id_usuario !== args.where.id_usuario?.not); },
      findUnique: async () => profiles[0],
    },
    servico: { findMany: async () => [] },
  });
  const result = await service.list({ page: 1, limit: 1, ordenar: 'nome' }, { id_usuario: 9, id_cliente: 20, id_diarista: null, activeProfile: 'CLIENTE' });
  assert.deepEqual(query.where.id_usuario, { not: 9 });
  assert.equal(result.data[0].id_diarista, 2);
  assert.equal(result.pagination.total, 2);
  assert.equal(result.pagination.pages, 2);
  assert.equal((await service.list({ ordenar: 'nome' })).data.length, 3, 'consulta pública sem sessão continua disponível');
  assert.equal((await service.find(1)).id_diarista, 1, 'detalhes do próprio perfil continuam acessíveis');
});

test('rota de busca valida sessão opcional e usa identidade do token, nunca a informada na query', async () => {
  const { default: app } = await import('../src/app.js');
  const previous = process.env.JWT_SECRET;
  process.env.JWT_SECRET = 'segredo-exclusivo-do-teste-local';
  // Delegates Prisma são proxies; atribuição é necessária porque mock.method depende de descriptors próprios.
  const originalFindUnique = prisma.usuario.findUnique;
  const findUser = async () => ({ id_usuario: 9, ativo: true, bloqueado: false, cliente: [{ id_cliente: 20 }], diarista: [{ id_diarista: 1 }] });
  prisma.usuario.findUnique = findUser;
  assert.equal(prisma.usuario.findUnique, findUser);
  const received = [];
  const searchMock = mock.method(DiaristaSearchService.prototype, 'list', async (query, auth) => {
    received.push({ query, auth });
    return { data: [], pagination: { page: 1, limit: 20, total: 0, pages: 0 } };
  });
  const token = jwt.sign({ activeProfile: 'CLIENTE' }, process.env.JWT_SECRET, { subject: '9', issuer: 'diaria-certa-api', audience: 'diaria-certa-app', expiresIn: '1h' });
  const server = createServer(app);
  server.listen(0, '127.0.0.1'); await once(server, 'listening');
  const url = `http://127.0.0.1:${server.address().port}/api/diarista`;
  try {
    let response = await fetch(url);
    assert.equal(response.status, 200);
    assert.equal(received[0].auth, undefined);
    response = await fetch(url + '?id_usuario=999', { headers: { Authorization: `Bearer ${token}` } });
    assert.equal(response.status, 200);
    assert.equal(response.headers.get('cache-control'), 'no-store');
    assert.match(response.headers.get('vary'), /Authorization/);
    assert.equal(received[1].auth.id_usuario, 9);
    assert.equal(received[1].auth.activeProfile, 'CLIENTE');
    assert.equal(received[1].query.id_usuario, undefined);
    response = await fetch(url, { headers: { Authorization: 'Bearer token-invalido' } });
    assert.equal(response.status, 401);
    assert.equal(received.length, 2);
  } finally {
    server.closeAllConnections(); await new Promise(resolve => server.close(resolve));
    prisma.usuario.findUnique = originalFindUnique; searchMock.mock.restore();
    if (previous === undefined) delete process.env.JWT_SECRET; else process.env.JWT_SECRET = previous;
  }
});

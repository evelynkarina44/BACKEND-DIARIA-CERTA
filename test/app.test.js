import test, { after, before } from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import app from '../src/app.js';

let server;
let baseUrl;

before(async () => {
  server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  baseUrl = `http://127.0.0.1:${server.address().port}`;
});

after(async () => {
  await new Promise((resolve) => server.close(resolve));
});

test('GET /api-docs.json disponibiliza o contrato OpenAPI', async () => {
  const response = await fetch(`${baseUrl}/api-docs.json`);
  assert.equal(response.status, 200);
  const document = await response.json();
  assert.equal(document.openapi, '3.0.3');
  assert.ok(document.paths['/api/agendamento/estimativa']);
});

test('GET /api-docs/ disponibiliza a interface Swagger UI', async () => {
  const response = await fetch(`${baseUrl}/api-docs/`);
  assert.equal(response.status, 200);
  assert.match(response.headers.get('content-type'), /text\/html/);
  assert.match(await response.text(), /id="swagger-ui"/);
});

test('GET /health confirma que a aplicação inicializou', async () => {
  const response = await fetch(`${baseUrl}/health`);
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { status: 'ok' });
});

test('rota inexistente retorna 404 padronizado', async () => {
  const response = await fetch(`${baseUrl}/inexistente`);
  assert.equal(response.status, 404);
  assert.equal((await response.json()).error, 'Rota não encontrada');
});

test('JSON malformado retorna 400', async () => {
  const response = await fetch(`${baseUrl}/api/usuario`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: '{',
  });
  assert.equal(response.status, 400);
  assert.equal((await response.json()).error, 'JSON malformado');
});

test('payload inválido retorna detalhes 422 antes de acessar o banco', async () => {
  const response = await fetch(`${baseUrl}/api/usuario`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ nome: 'A' }),
  });
  assert.equal(response.status, 422);
  const body = await response.json();
  assert.equal(body.error, 'Validation failed');
  assert.ok(body.details.fieldErrors.email);
});

test('rota privada rejeita requisição sem JWT', async () => {
  const response = await fetch(`${baseUrl}/api/cliente`);
  assert.equal(response.status, 401);
  assert.equal((await response.json()).error, 'Token de acesso ausente');
});

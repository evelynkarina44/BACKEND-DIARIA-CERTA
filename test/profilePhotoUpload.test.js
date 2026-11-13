import test, { mock } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readdir, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createServer } from 'node:http';
import { once } from 'node:events';
import jwt from 'jsonwebtoken';
import sharp from 'sharp';
import prisma from '../src/lib/prisma.js';
import { UploadProfilePhotoService, normalizeProfilePhoto, MAX_PHOTO_BYTES } from '../src/services/usuario/UploadProfilePhotoService.js';

const image = () => sharp({ create: { width: 80, height: 60, channels: 3, background: '#18C7C8' } }).png().withMetadata().toBuffer();

test('normaliza JPG/PNG/WebP em JPEG 512x512, removendo metadados', async () => {
  for (const format of ['png', 'jpeg', 'webp']) {
    const input = await sharp(await image()).toFormat(format).withMetadata().toBuffer();
    const metadata = await sharp(await normalizeProfilePhoto(input)).metadata();
    assert.equal(metadata.format, 'jpeg');
    assert.equal(metadata.width, 512);
    assert.equal(metadata.height, 512);
    assert.equal(metadata.exif, undefined);
    assert.equal(metadata.icc, undefined);
  }
});

test('rejeita vazio, arquivo disfarçado, SVG, corrupção e arquivo acima do limite', async () => {
  for (const input of [null, Buffer.alloc(0), Buffer.from('<script>alert(1)</script>'), Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" width="1" height="1"/>'), Buffer.from([0xff, 0xd8, 0xff])]) {
    await assert.rejects(() => normalizeProfilePhoto(input), error => error.statusCode === 400);
  }
  await assert.rejects(() => normalizeProfilePhoto(Buffer.alloc(MAX_PHOTO_BYTES + 1)), error => error.statusCode === 413);
});

test('salva arquivo aleatório e altera só foto_perfil da conta autenticada, sem expor senha', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'diaria-photo-test-'));
  let query;
  const service = new UploadProfilePhotoService({ usuario: { update: async args => { query = args; return { id_usuario: 9, foto_perfil: args.data.foto_perfil }; } } }, directory);
  try {
    const user = await service.execute(await image(), { id_usuario: 9 }, 'https://api.example.com');
    assert.deepEqual(query.where, { id_usuario: 9 });
    assert.deepEqual(Object.keys(query.data), ['foto_perfil']);
    assert.equal(query.select.senha, undefined);
    assert.match(user.foto_perfil, /^https:\/\/api\.example\.com\/uploads\/perfis\/[a-f\d-]{36}\.jpg$/);
    const files = await readdir(directory);
    assert.equal(files.length, 1);
    assert.equal((await sharp(await readFile(join(directory, files[0]))).metadata()).format, 'jpeg');
    await assert.rejects(async () => service.execute(await image(), null, 'https://api.example.com'), error => error.statusCode === 401);
  } finally { await rm(directory, { recursive: true, force: true }); }
});

test('falha no banco remove somente o arquivo novo, sem deixar upload órfão', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'diaria-photo-failure-'));
  const service = new UploadProfilePhotoService({ usuario: { update: async () => { throw new Error('database failure'); } } }, directory);
  try {
    await assert.rejects(async () => service.execute(await image(), { id_usuario: 9 }, 'https://api.example.com'), /database failure/);
    assert.deepEqual(await readdir(directory), []);
  } finally { await rm(directory, { recursive: true, force: true }); }
});

test('endpoint exige sessão, aceita binário, rejeita tipo incorreto e tamanho excedido', async () => {
  const { default: app } = await import('../src/app.js');
  const previousSecret = process.env.JWT_SECRET;
  process.env.JWT_SECRET = 'segredo-exclusivo-de-upload-teste';
  const originalFind = prisma.usuario.findUnique;
  prisma.usuario.findUnique = async () => ({ id_usuario: 9, ativo: true, bloqueado: false, cliente: [{ id_cliente: 1 }], diarista: [] });
  let received;
  const serviceMock = mock.method(UploadProfilePhotoService.prototype, 'execute', async (body, auth, base) => {
    received = { body, auth, base };
    return { id_usuario: auth.id_usuario, foto_perfil: 'https://example.com/photo.jpg' };
  });
  const token = jwt.sign({ activeProfile: 'CLIENTE' }, process.env.JWT_SECRET, { subject: '9', issuer: 'diaria-certa-api', audience: 'diaria-certa-app', expiresIn: '1h' });
  const server = createServer(app);
  server.listen(0, '127.0.0.1'); await once(server, 'listening');
  const url = `http://127.0.0.1:${server.address().port}/api/usuario/foto`;
  const headers = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/octet-stream' };
  try {
    assert.equal((await fetch(url, { method: 'POST', body: 'x' })).status, 401);
    const input = await image();
    const result = await fetch(url + '?id_usuario=999', { method: 'POST', headers, body: input });
    assert.equal(result.status, 200);
    assert.equal(received.auth.id_usuario, 9);
    assert.deepEqual(received.body, input);
    assert.equal(result.headers.get('cache-control'), 'no-store');
    assert.equal((await fetch(url, { method: 'POST', headers: { ...headers, 'Content-Type': 'text/html' }, body: '<html/>' })).status, 415);
    const tooLarge = await fetch(url, { method: 'POST', headers, body: Buffer.alloc(MAX_PHOTO_BYTES + 1) });
    assert.equal(tooLarge.status, 413);
    assert.match((await tooLarge.json()).error, /5 MB/);
    assert.equal(serviceMock.mock.calls.length, 1);
  } finally {
    server.closeAllConnections(); await new Promise(resolve => server.close(resolve));
    prisma.usuario.findUnique = originalFind; serviceMock.mock.restore();
    if (previousSecret === undefined) delete process.env.JWT_SECRET; else process.env.JWT_SECRET = previousSecret;
  }
});

import test from 'node:test';
import assert from 'node:assert/strict';
import sharp from 'sharp';
import { normalizeMedia, MAX_MEDIA, attachmentSelect } from '../src/services/media/attachmentMedia.js';
import { AvaliacaoAttachmentService, canReadReviewMedia } from '../src/services/avaliacao/AvaliacaoAttachmentService.js';
import { DenunciaAttachmentService } from '../src/services/denuncia/DenunciaAttachmentService.js';

// Small structural ISO-BMFF fixtures exercise content checks independently of MIME/extension.
function box(name, ...parts) { const data = Buffer.concat(parts), head = Buffer.alloc(8); head.writeUInt32BE(data.length + 8); head.write(name, 4); return Buffer.concat([head, data]); }
function mp4({ seconds = 5, handler = 'vide', codec = 'avc1', width = 320 } = {}) {
 const time = () => { const b = Buffer.alloc(24); b.writeUInt32BE(1000, 12); b.writeUInt32BE(seconds * 1000, 16); return b; };
 const hdlr = Buffer.alloc(24); hdlr.write(handler, 8);
 const sample = Buffer.alloc(78); sample.writeUInt16BE(width, 24); sample.writeUInt16BE(240, 26);
 const count = Buffer.alloc(8); count.writeUInt32BE(1, 4);
 return Buffer.concat([box('ftyp', Buffer.from('isom\0\0\0\0mp42')), box('moov', box('mvhd', time()),
  box('trak', box('mdia', box('mdhd', time()), box('hdlr', hdlr), box('minf', box('stbl', box('stsd', count, box(codec, sample, box('avcC', Buffer.from([1, 66, 0, 30, 255, 225, 0]))))))))), box('mdat', Buffer.from([0, 0, 0, 1, 0x65]))]);
}
test('valida os bytes da foto/vídeo e rejeita conteúdo falso, truncado, longo ou excessivo', async () => {
 const image = await sharp({ create: { width: 24, height: 48, channels: 3, background: 'white' } }).png().toBuffer();
 const photo = await normalizeMedia(image); assert.equal(photo.tipo, 'image'); assert.equal(photo.mime, 'image/jpeg');
 assert.equal((await sharp(photo.conteudo).metadata()).height, 48);
 const video = await normalizeMedia(mp4()); assert.equal(video.tipo, 'video'); assert.equal(video.mime, 'video/mp4');
 for (const input of [Buffer.from('<html>video.mp4</html>'), mp4({ seconds: 61 }), mp4({ seconds: 0 }), mp4({ handler: 'text' }), mp4({ codec: 'hvc1' }), mp4({ width: 6000 }), mp4().subarray(0, 20)]) {
  await assert.rejects(normalizeMedia(input), { statusCode: 400 });
 }
 await assert.rejects(normalizeMedia(Buffer.alloc(MAX_MEDIA + 1)), { statusCode: 413 });
 assert.equal(attachmentSelect.conteudo, undefined, 'listas nunca incluem os bytes do arquivo');
});

test('autor cliente ou diarista pode anexar, destinatário não pode; repetição não duplica e limite é compartilhado', async () => {
 for (const worker of [false, true]) {
  const review = { id_cliente: 2, id_diarista: 3, autor_tipo: worker ? 'Diarista' : 'Cliente' };
  const auth = worker ? { id_diarista: 3 } : { id_cliente: 2 }, recipient = worker ? { id_cliente: 2 } : { id_diarista: 3 };
  const saved = []; let locks = 0;
  const tx = { $queryRaw: async () => { locks++; }, avaliacao: { findUnique: async () => review }, avaliacao_anexo: {
   findFirst: async ({ where }) => saved.find(x => x.chave_cliente === where.chave_cliente), count: async () => saved.length,
   create: async ({ data }) => { saved.push(data); return { id_anexo: String(saved.length) }; },
  } };
  const service = new AvaliacaoAttachmentService({ $transaction: async fn => fn(tx) });
  await service.upload(5, mp4(), auth, 'attachment-test-0001');
  await service.upload(5, mp4(), auth, 'attachment-test-0001'); assert.equal(saved.length, 1);
  await assert.rejects(service.upload(5, mp4(), recipient), { statusCode: 403 });
  await service.upload(5, mp4(), auth, 'attachment-test-0002'); await service.upload(5, mp4(), auth, 'attachment-test-0003');
  await assert.rejects(service.upload(5, mp4(), auth, 'attachment-test-0004'), { statusCode: 400 });
  assert.ok(locks >= 5); assert.equal(saved.length, 3);
 }
});

test('leitura de avaliação segue visibilidade atual e usa ID de anexo vinculado à avaliação', async () => {
 const review = { id_cliente: 2, id_diarista: 3, comentario_publico: false };
 assert.equal(canReadReviewMedia(review), false); assert.equal(canReadReviewMedia(review, { id_cliente: 999 }), false);
 assert.equal(canReadReviewMedia(review, { id_diarista: 3 }), true);
 const service = new AvaliacaoAttachmentService({ avaliacao: { findUnique: async () => review }, avaliacao_anexo: {
  findFirst: async ({ where }) => where.id_avaliacao === 5 && where.id_anexo === 'video' ? { id_anexo: 'video', mime: 'video/mp4', tipo: 'video', conteudo: mp4() } : null,
 } });
 await assert.rejects(service.read(5, 'video', { id_cliente: 999 }), { statusCode: 403 });
 await assert.rejects(service.read(5, 'wrong', { id_diarista: 3 }), { statusCode: 404 });
 assert.ok((await service.read(5, 'video', { id_diarista: 3 })).dataUrl.startsWith('data:video/mp4;base64,'));
 review.comentario_publico = true; assert.equal((await service.read(5, 'video')).tipo, 'video');
 review.comentario_publico = false; await assert.rejects(service.read(5, 'video'), { statusCode: 403 });
});

test('vídeo de denúncia fica privado ao denunciante e admin, nunca ao denunciado', async () => {
 const row = { id_usuario_denunciante: 2, status: 'Pendente', versao: 0 }; let stored;
 const db = { denuncia: { findUnique: async () => row, updateMany: async () => ({ count: 1 }) }, denuncia_anexo: {
  findFirst: async ({ where }) => !stored || (where.chave_cliente && stored.chave_cliente !== where.chave_cliente) ? null : stored, count: async () => stored ? 1 : 0,
  create: async ({ data }) => { stored = { ...data, id_anexo: 'video' }; return stored; },
 } };
 const service = new DenunciaAttachmentService({ ...db, $transaction: async fn => fn(db) });
 await service.upload(5, mp4(), { id_usuario: 2 }, 'attachment-test-0001'); assert.equal(stored.tipo, 'video');
 assert.equal((await service.read(5, 'video', { id_usuario: 2 })).tipo, 'video');
 await assert.rejects(service.read(5, 'video', { id_usuario: 3, activeProfile: 'CLIENTE' }), { statusCode: 403 });
 assert.equal((await service.read(5, 'video', { id_usuario: 4, activeProfile: 'ADMIN', profiles: ['ADMIN'] })).tipo, 'video');
 row.status = 'EmAnalise';
 await assert.rejects(service.upload(5, mp4(), { id_usuario: 2 }, 'attachment-test-0002'), { statusCode: 409 });
});

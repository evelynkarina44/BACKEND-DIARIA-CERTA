import sharp from 'sharp';
import { AppError, BadRequestError } from '../../errors/index.js';

export const MAX_IMAGE = 5 * 1024 * 1024;
export const MAX_MEDIA = 10 * 1024 * 1024;
export const attachmentSelect = { id_anexo: true, nome: true, tipo: true, mime: true, criado_em: true };

export async function normalizeImage(input) {
 if (!Buffer.isBuffer(input) || !input.length) throw new BadRequestError('Selecione uma foto ou vídeo.');
 if (input.length > MAX_IMAGE) throw new AppError('A foto deve ter até 5 MB.', 413);
 try {
  const image = sharp(input, { limitInputPixels: 50_000_000, animated: false });
  if (!['jpeg', 'png', 'webp'].includes((await image.metadata()).format)) throw new Error();
  return await image.rotate().resize(2048, 2048, { fit: 'inside', withoutEnlargement: true }).jpeg({ quality: 85 }).toBuffer();
 } catch { throw new BadRequestError('Envie uma foto JPG, PNG ou WebP válida, de até 5 MB.'); }
}

// Inspect bounded ISO-BMFF boxes, not the extension or the MIME declared by the sender.
// Videos are not transcoded: only non-fragmented MP4/H.264 is accepted for mobile/web playback.
function boxes(buffer, start = 0, end = buffer.length) {
 const result = [];
 for (let offset = start; offset < end;) {
  if (end - offset < 8 || result.length >= 10000) throw new Error();
  let size = buffer.readUInt32BE(offset), header = 8;
  if (size === 1) { if (end - offset < 16) throw new Error(); size = Number(buffer.readBigUInt64BE(offset + 8)); header = 16; }
  if (size === 0) size = end - offset;
  if (!Number.isSafeInteger(size) || size < header || size > end - offset) throw new Error();
  result.push({ type: buffer.toString('ascii', offset + 4, offset + 8), start: offset + header, end: offset + size });
  offset += size;
 }
 return result;
}
function child(input, box, name) {
 const found = boxes(input, box.start, box.end).find(item => item.type === name);
 if (!found) throw new Error();
 return found;
}
function duration(input, box) {
 const version = input[box.start];
 const scaleOffset = box.start + (version === 1 ? 20 : 12), durationOffset = scaleOffset + 4;
 if (version > 1 || durationOffset + (version ? 8 : 4) > box.end) throw new Error();
 const scale = input.readUInt32BE(scaleOffset);
 const ticks = version ? Number(input.readBigUInt64BE(durationOffset)) : input.readUInt32BE(durationOffset);
 if (!scale || !Number.isSafeInteger(ticks) || ticks <= 0 || ticks / scale > 60) throw new Error();
}
export function validateVideo(input) {
 try {
  const top = boxes(input), ftyp = top.find(b => b.type === 'ftyp'), moov = top.find(b => b.type === 'moov');
  if (!ftyp || ftyp.end - ftyp.start < 8 || !moov || top.some(b => ['moof', 'sidx'].includes(b.type)) || !top.some(b => b.type === 'mdat' && b.end > b.start)) throw new Error();
  const brands = [input.toString('ascii', ftyp.start, ftyp.start + 4)];
  for (let p = ftyp.start + 8; p + 4 <= ftyp.end; p += 4) brands.push(input.toString('ascii', p, p + 4));
  if (!brands.some(b => ['isom', 'iso2', 'mp41', 'mp42', 'avc1'].includes(b))) throw new Error();
  duration(input, child(input, moov, 'mvhd'));
  let video = false;
  for (const track of boxes(input, moov.start, moov.end).filter(b => b.type === 'trak')) {
   const mdia = child(input, track, 'mdia'), hdlr = child(input, mdia, 'hdlr');
   if (hdlr.start + 12 > hdlr.end) throw new Error();
   const handler = input.toString('ascii', hdlr.start + 8, hdlr.start + 12);
   if (!['vide', 'soun'].includes(handler)) throw new Error();
   duration(input, child(input, mdia, 'mdhd'));
   const stbl = child(input, child(input, mdia, 'minf'), 'stbl'), stsd = child(input, stbl, 'stsd');
   if (stsd.start + 8 > stsd.end || input.readUInt32BE(stsd.start + 4) !== 1) throw new Error();
   const entry = boxes(input, stsd.start + 8, stsd.end);
   if (entry.length !== 1 || !(handler === 'vide' ? ['avc1', 'avc3'] : ['mp4a']).includes(entry[0].type)) throw new Error();
   if (handler === 'vide') {
    video = true;
    if (entry[0].end - entry[0].start < 78) throw new Error();
    const width = input.readUInt16BE(entry[0].start + 24), height = input.readUInt16BE(entry[0].start + 26);
    if (!width || !height || width > 4096 || height > 4096) throw new Error();
    const avc = boxes(input, entry[0].start + 78, entry[0].end).find(b => b.type === 'avcC');
    if (!avc || avc.end - avc.start < 7 || input[avc.start] !== 1) throw new Error();
   }
  }
  if (!video) throw new Error();
  return input;
 } catch { throw new BadRequestError('Envie um vídeo MP4 (H.264) válido, de até 1 minuto e 10 MB.'); }
}
export async function normalizeMedia(input) {
 if (!Buffer.isBuffer(input) || !input.length) throw new BadRequestError('Selecione uma foto ou vídeo.');
 if (input.length > MAX_MEDIA) throw new AppError('O vídeo deve ter até 10 MB; fotos, até 5 MB.', 413);
 if (input.length >= 12 && input.toString('ascii', 4, 8) === 'ftyp') return { conteudo: validateVideo(input), tipo: 'video', mime: 'video/mp4', nome: 'Vídeo anexado' };
 return { conteudo: await normalizeImage(input), tipo: 'image', mime: 'image/jpeg', nome: 'Foto anexada' };
}
export function presentAttachment(item) {
 return { id_anexo: item.id_anexo, tipo: item.tipo ?? 'image', mime: item.mime ?? 'image/jpeg', dataUrl: 'data:' + (item.mime ?? 'image/jpeg') + ';base64,' + Buffer.from(item.conteudo).toString('base64') };
}

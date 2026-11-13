import { mkdir, writeFile, unlink } from 'node:fs/promises';
import { randomUUID } from 'node:crypto';
import { resolve, join } from 'node:path';
import sharp from 'sharp';
import prisma from '../../lib/prisma.js';
import { AppError, BadRequestError, UnauthorizedError } from '../../errors/index.js';
import { usuarioPublicSelect } from './usuarioSelect.js';

export const photoDirectory = resolve('uploads/perfis');
export const MAX_PHOTO_BYTES = 5 * 1024 * 1024;

// Reencodar remove metadados (inclusive GPS) e impede servir arquivos arbitrários.
export async function normalizeProfilePhoto(input) {
  if (!Buffer.isBuffer(input) || input.length === 0) throw new BadRequestError('Selecione uma imagem para enviar.');
  if (input.length > MAX_PHOTO_BYTES) throw new AppError('A imagem deve ter até 5 MB.', 413);
  try {
    const image = sharp(input, { limitInputPixels: 50_000_000, animated: false });
    const metadata = await image.metadata();
    if (!['jpeg', 'png', 'webp'].includes(metadata.format)) throw new Error('unsupported image');
    return await image.rotate().resize(512, 512, { fit: 'cover' }).jpeg({ quality: 85 }).toBuffer();
  } catch {
    throw new BadRequestError('Imagem inválida. Escolha uma foto JPG, PNG ou WebP de até 5 MB.');
  }
}

export class UploadProfilePhotoService {
  constructor(database = prisma, directory = photoDirectory) {
    this.database = database;
    this.directory = directory;
  }

  async execute(input, auth, publicBaseUrl) {
    if (!Number.isSafeInteger(auth?.id_usuario) || auth.id_usuario <= 0) throw new UnauthorizedError('Entre na conta para alterar a foto.');
    const base = new URL(publicBaseUrl);
    if (!['http:', 'https:'].includes(base.protocol) || base.username || base.password) throw new BadRequestError('Endereço público da API inválido.');
    const filename = `${randomUUID()}.jpg`;
    const photoUrl = `${base.origin}/uploads/perfis/${filename}`;
    if (photoUrl.length > 255) throw new BadRequestError('Endereço público da API muito longo.');
    const image = await normalizeProfilePhoto(input);
    await mkdir(this.directory, { recursive: true });
    const file = join(this.directory, filename);
    await writeFile(file, image, { flag: 'wx' });
    try {
      // A identidade vem apenas da sessão: cliente e diarista compartilham a mesma foto.
      return await this.database.usuario.update({
        where: { id_usuario: auth.id_usuario }, data: { foto_perfil: photoUrl }, select: usuarioPublicSelect,
      });
    } catch (error) {
      await unlink(file).catch(() => {}); // Apenas o arquivo novo desta requisição.
      throw error;
    }
  }
}

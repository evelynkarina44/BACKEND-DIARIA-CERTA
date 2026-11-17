import { raw } from 'express';
import { rateLimit } from 'express-rate-limit';
import { z } from 'zod';
import { AppError } from '../errors/index.js';
import { MAX_MEDIA } from '../services/media/attachmentMedia.js';

export const attachmentParams = z.object({ id: z.coerce.number().int().positive(), anexo: z.string().uuid() });
export const attachmentUpload = [
 rateLimit({ windowMs: 15 * 60 * 1000, limit: 24, standardHeaders: true, legacyHeaders: false }),
 (req, res, next) => {
  res.set('Cache-Control', 'no-store'); res.vary('Authorization');
  if (!req.is('application/octet-stream')) return next(new AppError('Envie a foto ou vídeo como arquivo.', 415));
  const key = req.get('X-Anexo-Id');
  if (key && !/^[a-zA-Z0-9-]{16,80}$/.test(key)) return next(new AppError('Identificador de anexo inválido.', 400));
  next();
 },
 raw({ type: 'application/octet-stream', limit: MAX_MEDIA }),
];

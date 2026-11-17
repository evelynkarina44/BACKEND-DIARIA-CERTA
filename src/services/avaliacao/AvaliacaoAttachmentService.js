import prisma from '../../lib/prisma.js';
import { BadRequestError, ForbiddenError, NotFoundError } from '../../errors/index.js';
import { normalizeMedia, attachmentSelect, presentAttachment } from '../media/attachmentMedia.js';

function author(review, auth) {
 return review.autor_tipo === 'Cliente' ? Boolean(auth?.id_cliente && auth.id_cliente === review.id_cliente)
  : Boolean(auth?.id_diarista && auth.id_diarista === review.id_diarista);
}
export function canReadReviewMedia(review, auth) {
 return Boolean(review.comentario_publico || (auth?.id_cliente && auth.id_cliente === review.id_cliente) || (auth?.id_diarista && auth.id_diarista === review.id_diarista));
}
export class AvaliacaoAttachmentService {
 constructor(database = prisma) { this.database = database; }
 async upload(id, input, auth, key) {
  const media = await normalizeMedia(input);
  return this.database.$transaction(async tx => {
   await tx.$queryRaw`SELECT id_avaliacao FROM avaliacao WHERE id_avaliacao = ${Number(id)} FOR UPDATE`;
   const review = await tx.avaliacao.findUnique({ where: { id_avaliacao: Number(id) } });
   if (!review) throw new NotFoundError('Avaliação não encontrada.');
   if (!author(review, auth)) throw new ForbiddenError('Somente o autor pode anexar à avaliação.');
   if (key) {
    const previous = await tx.avaliacao_anexo.findFirst({ where: { id_avaliacao: Number(id), chave_cliente: key }, select: attachmentSelect });
    if (previous) return previous;
   }
   if (await tx.avaliacao_anexo.count({ where: { id_avaliacao: Number(id) } }) >= 3) throw new BadRequestError('São permitidos até 3 anexos por avaliação.');
   return tx.avaliacao_anexo.create({ data: { id_avaliacao: Number(id), ...media, ...(key ? { chave_cliente: key } : {}) }, select: attachmentSelect });
  });
 }
 async read(id, attachment, auth) {
  const review = await this.database.avaliacao.findUnique({ where: { id_avaliacao: Number(id) } });
  if (!review) throw new NotFoundError('Avaliação não encontrada.');
  if (!canReadReviewMedia(review, auth)) throw new ForbiddenError('Anexo de avaliação privada.');
  const media = await this.database.avaliacao_anexo.findFirst({ where: { id_anexo: attachment, id_avaliacao: Number(id) } });
  if (!media) throw new NotFoundError('Anexo não encontrado.');
  return presentAttachment(media);
 }
}

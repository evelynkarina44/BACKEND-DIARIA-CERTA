import { createHmac, timingSafeEqual } from 'node:crypto';
import { UnauthorizedError } from '../../errors/index.js';

export function verifyWebhook({ signature, requestId, paymentId }, secret) {
  if (!secret || typeof signature !== 'string' || typeof requestId !== 'string' || typeof paymentId !== 'string') {
    throw new UnauthorizedError('Notificação de pagamento inválida.');
  }
  const fields = Object.fromEntries(signature.split(',').map((part) => part.trim().split('=')));
  if (!/^\d+$/.test(fields.ts || '') || !/^[a-f0-9]{64}$/i.test(fields.v1 || '') || !/^\d+$/.test(paymentId)) {
    throw new UnauthorizedError('Assinatura de pagamento inválida.');
  }
  const manifest = `id:${paymentId.toLowerCase()};request-id:${requestId};ts:${fields.ts};`;
  const expected = createHmac('sha256', secret).update(manifest).digest();
  if (!timingSafeEqual(expected, Buffer.from(fields.v1, 'hex'))) {
    throw new UnauthorizedError('Assinatura de pagamento inválida.');
  }
  // Reentregas legítimas podem ser antigas. A idempotência e a consulta à API
  // protegem contra replay sem descartar uma atualização financeira verdadeira.
}

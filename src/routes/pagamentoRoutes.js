import { Router } from 'express';
import { rateLimit } from 'express-rate-limit';
import { z } from 'zod';
import { authenticate, authorizeRoles } from '../middlewares/auth.js';
import { validate } from '../middlewares/validate.js';
import { idSchema } from '../schemas/apiSchemas.js';
import { BadRequestError } from '../errors/index.js';
import { PaymentService } from '../services/pagamento/PaymentService.js';
import { verifyWebhook } from '../services/pagamento/verifyWebhook.js';

const router = Router();
const service = new PaymentService();
const checkoutSchema = z.object({ fase: z.enum(['Entrada', 'Saldo']) }).strict();
const limit = rateLimit({ windowMs: 60000, limit: 30, standardHeaders: 'draft-8', legacyHeaders: false,
  message: { error: 'Muitas consultas de pagamento. Aguarde um minuto.' } });

// Mercado Pago não possui JWT do cliente: esta rota é autenticada pela assinatura HMAC.
router.post('/webhook', async (req, res) => {
  const paymentId = req.query['data.id'];
  const config = service.provider.config();
  verifyWebhook({ signature: req.get('x-signature'), requestId: req.get('x-request-id'), paymentId }, config.webhookSecret);
  if (req.body?.data?.id != null && String(req.body.data.id) !== paymentId) throw new BadRequestError('Identificadores da notificação divergentes.');
  if ((req.body?.type || req.query.type) !== 'payment') return res.status(200).json({ ignored: true });
  return res.status(200).json(await service.reconcile(paymentId));
});

router.use(authenticate);
router.get('/agendamento/:id', validate(idSchema, 'params'), async (req, res) => {
  return res.status(200).json(await service.get(req.params.id, req.auth));
});
router.post('/agendamento/:id/checkout', limit, authorizeRoles('cliente'), validate(idSchema, 'params'), validate(checkoutSchema), async (req, res) => {
  return res.status(200).json(await service.checkout(req.params.id, req.body.fase, req.auth));
});
router.post('/agendamento/:id/sincronizar', limit, validate(idSchema, 'params'), validate(z.object({}).strict()), async (req, res) => {
  return res.status(200).json(await service.refresh(req.params.id, req.auth));
});

export default router;

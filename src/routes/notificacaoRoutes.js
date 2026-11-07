import { Router } from 'express';
import { z } from 'zod';
import { authenticate } from '../middlewares/auth.js';
import { validate } from '../middlewares/validate.js';
import { paginationSchema } from '../schemas/apiSchemas.js';
import { NotificationService } from '../services/notificacao/NotificationService.js';
const router = Router();
const service = new NotificationService();
router.use(authenticate);
router.get('/', validate(paginationSchema, 'query'), async (req, res) => {
  res.set('Cache-Control', 'no-store');
  return res.json(await service.list(req.query, req.auth));
});
router.put('/:id/lida', validate(z.object({ id: z.string().regex(/^[a-f0-9]{64}$/) }), 'params'), async (req, res) => {
  return res.json(await service.markRead(req.params.id, req.auth));
});
router.post('/marcar-todas-lidas', validate(z.object({}).strict()), async (req, res) => {
  return res.json(await service.markAll(req.auth));
});
export default router;

import { Router } from 'express';
import { rateLimit } from 'express-rate-limit';
import { CheckUsuarioAvailabilityService } from '../services/usuario/CheckUsuarioAvailabilityService.js';
import { UsuarioController } from '../controllers/usuarioController.js';
import { authenticate } from '../middlewares/auth.js';
import { validate } from '../middlewares/validate.js';
import { checkRegistrationSchema, createUsuarioSchema, idSchema, listQuerySchema, updateUsuarioSchema } from '../schemas/apiSchemas.js';

const router = Router();
const controller = new UsuarioController();
const availability = new CheckUsuarioAvailabilityService();
const availabilityLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, limit: 30, standardHeaders: true, legacyHeaders: false,
  message: { error: 'Muitas consultas de cadastro. Aguarde alguns minutos e tente novamente.' },
});

// CPF/e-mail ficam no corpo, não na URL. Nunca retorna dados de outra conta.
router.post('/validar-cadastro', (_req, res, next) => {
  res.set('Cache-Control', 'no-store');
  next();
}, availabilityLimiter, validate(checkRegistrationSchema), async (req, res) => {
  return res.json(await availability.execute(req.body));
});

router.post('/', validate(createUsuarioSchema), controller.criarUsuario);
router.use(authenticate);
router.get('/', validate(listQuerySchema, 'query'), controller.listarUsuarios);
router.get('/:id', validate(idSchema, 'params'), controller.buscarUsuarioPorId);
router.put('/:id', validate(idSchema, 'params'), validate(updateUsuarioSchema), controller.atualizarUsuario);
router.delete('/:id', validate(idSchema, 'params'), controller.deletarUsuario);

export default router;

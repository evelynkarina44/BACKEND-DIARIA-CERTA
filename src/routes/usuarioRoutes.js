import { Router, raw } from 'express';
import { UploadProfilePhotoService, MAX_PHOTO_BYTES } from '../services/usuario/UploadProfilePhotoService.js';
import { AppError } from '../errors/index.js';
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
router.post('/foto', rateLimit({ windowMs: 15 * 60 * 1000, limit: 20, standardHeaders: true, legacyHeaders: false,
  message: { error: 'Muitas alterações de foto. Aguarde alguns minutos.' } }),
  (req, _res, next) => req.is('application/octet-stream') ? next() : next(new AppError('Envie o arquivo de imagem.', 415)),
  raw({ type: 'application/octet-stream', limit: MAX_PHOTO_BYTES }), async (req, res) => {
    const baseUrl = process.env.PUBLIC_API_URL?.trim() || `${req.protocol}://${req.get('host')}`;
    const user = await new UploadProfilePhotoService().execute(req.body, req.auth, baseUrl);
    res.set('Cache-Control', 'no-store');
    return res.json(user);
  });
router.get('/', validate(listQuerySchema, 'query'), controller.listarUsuarios);
router.get('/:id', validate(idSchema, 'params'), controller.buscarUsuarioPorId);
router.put('/:id', validate(idSchema, 'params'), validate(updateUsuarioSchema), controller.atualizarUsuario);
router.delete('/:id', validate(idSchema, 'params'), controller.deletarUsuario);

export default router;

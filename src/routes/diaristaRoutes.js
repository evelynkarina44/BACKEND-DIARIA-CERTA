import { Router } from 'express';
import { DiaristaController } from '../controllers/diaristaController.js';
import { DiaristaStatsController } from '../controllers/diaristaStatsController.js';
import { authenticate, optionalAuthenticate, authorizeRoles } from '../middlewares/auth.js';
import { validate } from '../middlewares/validate.js';
import { createDiaristaSchema, diaristaSearchSchema, idSchema, updateDiaristaSchema } from '../schemas/apiSchemas.js';

const router = Router();
const controller = new DiaristaController();
const statsController = new DiaristaStatsController();

router.get('/', optionalAuthenticate, (req, res, next) => {
  res.set('Cache-Control', 'no-store');
  res.vary('Authorization');
  next();
}, validate(diaristaSearchSchema, 'query'), controller.listarDiaristas);
router.get('/:id', validate(idSchema, 'params'), controller.buscarDiaristaPorId);
router.post('/', authenticate, validate(createDiaristaSchema), controller.criarDiarista);
router.get('/:id/estatisticas', authenticate, authorizeRoles('diarista'), validate(idSchema, 'params'), statsController.buscar);
router.put('/:id', authenticate, authorizeRoles('diarista'), validate(idSchema, 'params'), validate(updateDiaristaSchema), controller.atualizarDiarista);
router.delete('/:id', authenticate, authorizeRoles('diarista'), validate(idSchema, 'params'), controller.deletarDiarista);

export default router;

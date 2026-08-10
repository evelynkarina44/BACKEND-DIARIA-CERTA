import { Router } from 'express';
import { DisponibilidadeDiaristaController } from '../controllers/disponibilidadeDiaristaController.js';
import { authenticate, authorizeRoles } from '../middlewares/auth.js';
import { validate } from '../middlewares/validate.js';
import { ownDisponibilidade, requireOwnProfileInBody } from '../middlewares/ownership.js';
import { createDisponibilidadeSchema, idSchema, listQuerySchema, updateDisponibilidadeSchema } from '../schemas/apiSchemas.js';

const router = Router();
const controller = new DisponibilidadeDiaristaController();

router.get('/', validate(listQuerySchema, 'query'), controller.listarDisponibilidades);
router.get('/:id', validate(idSchema, 'params'), controller.buscarDisponibilidadePorId);
router.post('/', authenticate, authorizeRoles('diarista'), validate(createDisponibilidadeSchema), requireOwnProfileInBody('id_diarista', 'id_diarista'), controller.criarDisponibilidade);
router.put('/:id', authenticate, authorizeRoles('diarista'), validate(idSchema, 'params'), ownDisponibilidade, validate(updateDisponibilidadeSchema), controller.atualizarDisponibilidade);
router.delete('/:id', authenticate, authorizeRoles('diarista'), validate(idSchema, 'params'), ownDisponibilidade, controller.deletarDisponibilidade);

export default router;

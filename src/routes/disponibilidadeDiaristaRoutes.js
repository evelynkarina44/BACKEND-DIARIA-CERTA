import { Router } from 'express';
import { DisponibilidadeDiaristaController } from '../controllers/disponibilidadeDiaristaController.js';
import { authenticate, authorizeRoles } from '../middlewares/auth.js';
import { validate } from '../middlewares/validate.js';
import { ownDisponibilidade, requireOwnProfileInBody } from '../middlewares/ownership.js';
import { createDisponibilidadeSchema, idSchema, listQuerySchema, updateDisponibilidadeSchema, saveMonthlyAvailabilitySchema } from '../schemas/apiSchemas.js';
import { SaveMonthlyAvailabilityService } from '../services/disponibilidadeDiarista/SaveMonthlyAvailabilityService.js';

const router = Router();
const controller = new DisponibilidadeDiaristaController();

router.put('/mensal', authenticate, authorizeRoles('diarista'), validate(saveMonthlyAvailabilitySchema), async (req, res) => {
  const result = await new SaveMonthlyAvailabilityService().execute(req.body, req.auth);
  res.json(result);
});

router.get('/', validate(listQuerySchema, 'query'), controller.listarDisponibilidades);
router.get('/:id', validate(idSchema, 'params'), controller.buscarDisponibilidadePorId);
router.post('/', authenticate, authorizeRoles('diarista'), validate(createDisponibilidadeSchema), requireOwnProfileInBody('id_diarista', 'id_diarista'), controller.criarDisponibilidade);
router.put('/:id', authenticate, authorizeRoles('diarista'), validate(idSchema, 'params'), ownDisponibilidade, validate(updateDisponibilidadeSchema), controller.atualizarDisponibilidade);
router.delete('/:id', authenticate, authorizeRoles('diarista'), validate(idSchema, 'params'), ownDisponibilidade, controller.deletarDisponibilidade);

export default router;

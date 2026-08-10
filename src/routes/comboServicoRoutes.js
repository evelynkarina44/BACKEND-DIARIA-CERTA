import { Router } from 'express';
import { ComboServicoController } from '../controllers/comboServicoController.js';
import { authenticate, authorizeRoles } from '../middlewares/auth.js';
import { validate } from '../middlewares/validate.js';
import { ownComboServico, requireOwnComboFromBody } from '../middlewares/ownership.js';
import { createComboServicoSchema, idSchema, listQuerySchema, updateComboServicoSchema } from '../schemas/apiSchemas.js';

const router = Router();
const controller = new ComboServicoController();

router.get('/', validate(listQuerySchema, 'query'), controller.listarComboServicos);
router.get('/:id', validate(idSchema, 'params'), controller.buscarComboServicoPorId);
router.post('/', authenticate, authorizeRoles('diarista'), validate(createComboServicoSchema), requireOwnComboFromBody, controller.criarComboServico);
router.put('/:id', authenticate, authorizeRoles('diarista'), validate(idSchema, 'params'), ownComboServico, validate(updateComboServicoSchema), requireOwnComboFromBody, controller.atualizarComboServico);
router.delete('/:id', authenticate, authorizeRoles('diarista'), validate(idSchema, 'params'), ownComboServico, controller.deletarComboServico);

export default router;

import { Router } from 'express';
import { ComboBaseController } from '../controllers/comboBaseController.js';
import { authenticate, authorizeRoles } from '../middlewares/auth.js';
import { validate } from '../middlewares/validate.js';
import { ownComboBase, requireOwnProfileInBody } from '../middlewares/ownership.js';
import { createComboBaseSchema, idSchema, listQuerySchema, updateComboBaseSchema } from '../schemas/apiSchemas.js';

const router = Router();
const controller = new ComboBaseController();

router.get('/', validate(listQuerySchema, 'query'), controller.listarComboBases);
router.get('/:id', validate(idSchema, 'params'), controller.buscarComboBasePorId);
router.post('/', authenticate, authorizeRoles('diarista'), validate(createComboBaseSchema), requireOwnProfileInBody('id_diarista', 'id_diarista'), controller.criarComboBase);
router.put('/:id', authenticate, authorizeRoles('diarista'), validate(idSchema, 'params'), ownComboBase, validate(updateComboBaseSchema), controller.atualizarComboBase);
router.delete('/:id', authenticate, authorizeRoles('diarista'), validate(idSchema, 'params'), ownComboBase, controller.deletarComboBase);

export default router;

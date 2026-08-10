import { Router } from 'express';
import { DiaristaServicoController } from '../controllers/diaristaServicoController.js';
import { authenticate, authorizeRoles } from '../middlewares/auth.js';
import { validate } from '../middlewares/validate.js';
import { ownDiaristaServico, requireOwnProfileInBody } from '../middlewares/ownership.js';
import { createDiaristaServicoSchema, idSchema, listQuerySchema, updateDiaristaServicoSchema } from '../schemas/apiSchemas.js';

const router = Router();
const controller = new DiaristaServicoController();

router.get('/', validate(listQuerySchema, 'query'), controller.listarDiaristaServicos);
router.get('/:id', validate(idSchema, 'params'), controller.buscarDiaristaServicoPorId);
router.post('/', authenticate, authorizeRoles('diarista'), validate(createDiaristaServicoSchema), requireOwnProfileInBody('id_diarista', 'id_diarista'), controller.criarDiaristaServico);
router.put('/:id', authenticate, authorizeRoles('diarista'), validate(idSchema, 'params'), ownDiaristaServico, validate(updateDiaristaServicoSchema), controller.atualizarDiaristaServico);
router.delete('/:id', authenticate, authorizeRoles('diarista'), validate(idSchema, 'params'), ownDiaristaServico, controller.deletarDiaristaServico);

export default router;

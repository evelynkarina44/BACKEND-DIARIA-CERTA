import { Router } from 'express';
import { ServicoController } from '../controllers/servicoController.js';
import { authenticate } from '../middlewares/auth.js';
import { validate } from '../middlewares/validate.js';
import { createServicoSchema, idSchema, listQuerySchema, updateServicoSchema } from '../schemas/apiSchemas.js';

const router = Router();
const controller = new ServicoController();

router.get('/', validate(listQuerySchema, 'query'), controller.listarServicos);
router.get('/:id', validate(idSchema, 'params'), controller.buscarServicoPorId);
router.post('/', authenticate, validate(createServicoSchema), controller.criarServico);
router.put('/:id', authenticate, validate(idSchema, 'params'), validate(updateServicoSchema), controller.atualizarServico);
router.delete('/:id', authenticate, validate(idSchema, 'params'), controller.deletarServico);

export default router;

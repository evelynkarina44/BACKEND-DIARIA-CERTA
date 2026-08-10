import { Router } from 'express';
import { OcorrenciaAgendamentoController } from '../controllers/ocorrenciaAgendamentoController.js';
import { authenticate } from '../middlewares/auth.js';
import { validate } from '../middlewares/validate.js';
import { createOcorrenciaSchema, idSchema, listQuerySchema, updateOcorrenciaSchema } from '../schemas/apiSchemas.js';

const router = Router();
const controller = new OcorrenciaAgendamentoController();

router.use(authenticate);
router.get('/', validate(listQuerySchema, 'query'), controller.listarOcorrencias);
router.get('/:id', validate(idSchema, 'params'), controller.buscarOcorrenciaPorId);
router.post('/', validate(createOcorrenciaSchema), controller.criarOcorrencia);
router.put('/:id', validate(idSchema, 'params'), validate(updateOcorrenciaSchema), controller.atualizarOcorrencia);
router.delete('/:id', validate(idSchema, 'params'), controller.deletarOcorrencia);

export default router;

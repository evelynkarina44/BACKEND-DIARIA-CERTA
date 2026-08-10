import { Router } from 'express';
import { AgendamentoServicoController } from '../controllers/agendamentoServicoController.js';
import { authenticate } from '../middlewares/auth.js';
import { validate } from '../middlewares/validate.js';
import { idSchema, listQuerySchema } from '../schemas/apiSchemas.js';

const router = Router();
const controller = new AgendamentoServicoController();

router.use(authenticate);
router.get('/', validate(listQuerySchema, 'query'), controller.listarAgendamentoServicos);
router.get('/:id', validate(idSchema, 'params'), controller.buscarAgendamentoServicoPorId);

export default router;

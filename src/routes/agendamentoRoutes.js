import { Router } from 'express';
import { AgendamentoController } from '../controllers/agendamentoController.js';
import { AgendamentoWorkflowController } from '../controllers/agendamentoWorkflowController.js';
import { authenticate, authorizeRoles } from '../middlewares/auth.js';
import { validate } from '../middlewares/validate.js';
import { agendamentoQuerySchema, cancelAgendamentoSchema, createAgendamentoSchema, idSchema, updateAgendamentoSchema } from '../schemas/apiSchemas.js';

const router = Router();
const controller = new AgendamentoController();
const workflow = new AgendamentoWorkflowController();

router.use(authenticate);
router.get('/', validate(agendamentoQuerySchema, 'query'), controller.listarAgendamentos);
router.post('/estimativa', authorizeRoles('cliente'), validate(createAgendamentoSchema), workflow.estimar);
router.post('/', authorizeRoles('cliente'), validate(createAgendamentoSchema), controller.criarAgendamento);
router.post('/:id/aceitar', authorizeRoles('diarista'), validate(idSchema, 'params'), workflow.aceitar);
router.post('/:id/recusar', authorizeRoles('diarista'), validate(idSchema, 'params'), workflow.recusar);
router.post('/:id/cancelar', validate(idSchema, 'params'), validate(cancelAgendamentoSchema), workflow.cancelar);
router.get('/:id', validate(idSchema, 'params'), controller.buscarAgendamentoPorId);
router.put('/:id', validate(idSchema, 'params'), validate(updateAgendamentoSchema), controller.atualizarAgendamento);
router.delete('/:id', validate(idSchema, 'params'), controller.deletarAgendamento);

export default router;

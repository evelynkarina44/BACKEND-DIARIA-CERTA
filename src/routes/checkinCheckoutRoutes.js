import { Router } from 'express';
import { CheckinWorkflowController } from '../controllers/checkinWorkflowController.js';
import { authenticate, authorizeRoles } from '../middlewares/auth.js';
import { validate } from '../middlewares/validate.js';
import { idSchema } from '../schemas/apiSchemas.js';

const router = Router();
const controller = new CheckinWorkflowController();

router.use(authenticate);
router.get('/agendamento/:id', validate(idSchema, 'params'), controller.buscarPorAgendamento);
router.post('/agendamento/:id/solicitar', authorizeRoles('diarista'), validate(idSchema, 'params'), controller.solicitar);
router.post('/agendamento/:id/confirmar-pagamento', authorizeRoles('cliente'), validate(idSchema, 'params'), controller.confirmarPagamento);
router.post('/agendamento/:id/checkout', authorizeRoles('diarista'), validate(idSchema, 'params'), controller.checkout);

export default router;

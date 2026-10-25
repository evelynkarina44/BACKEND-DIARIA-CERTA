// PEDRO | ETAPA 2 — API: autenticação -> validação -> controller.
// Mostrar o envio de mensagem e continuar em ChatbotController.enviarMensagem().
import { Router } from 'express';
import { rateLimit } from 'express-rate-limit';
import { ChatbotController } from '../controllers/chatbotController.js';
import { authenticate, authorizeRoles } from '../middlewares/auth.js';
import { validate } from '../middlewares/validate.js';
import { chatbotIdSchema, chatbotMessageSchema, createConversationSchema, listConversationsSchema } from '../schemas/chatbotSchemas.js';

const router = Router();
const controller = new ChatbotController();
const limiter = rateLimit({ windowMs: 60 * 1000, limit: 20, keyGenerator: (req) => String(req.auth.id_usuario), standardHeaders: true, legacyHeaders: false, message: { error: 'Muitas mensagens. Aguarde um minuto e tente novamente.' } });

// Identidade e perfil vêm da sessão; a rota não decide preços nem executa regras da diária.
router.use(authenticate, authorizeRoles('cliente'), limiter);
router.post('/conversas', validate(createConversationSchema), controller.criarConversa);
router.get('/conversas', validate(listConversationsSchema, 'query'), controller.listarConversas);
router.get('/conversas/:id', validate(chatbotIdSchema, 'params'), controller.buscarConversa);
router.post('/conversas/:id/mensagens', validate(chatbotIdSchema, 'params'), validate(chatbotMessageSchema), controller.enviarMensagem);
router.post('/propostas/:id/confirmar', validate(chatbotIdSchema, 'params'), controller.confirmarProposta);
router.post('/propostas/:id/cancelar', validate(chatbotIdSchema, 'params'), controller.cancelarProposta);

export default router;

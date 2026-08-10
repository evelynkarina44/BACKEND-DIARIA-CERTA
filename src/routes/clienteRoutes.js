import { Router } from 'express';
import { ClienteController } from '../controllers/clienteController.js';
import { authenticate } from '../middlewares/auth.js';
import { validate } from '../middlewares/validate.js';
import { createClienteSchema, idSchema, listQuerySchema, updateClienteSchema } from '../schemas/apiSchemas.js';

const router = Router();
const controller = new ClienteController();

router.use(authenticate);
router.get('/', validate(listQuerySchema, 'query'), controller.listarClientes);
router.get('/:id', validate(idSchema, 'params'), controller.buscarClientePorId);
router.post('/', validate(createClienteSchema), controller.criarCliente);
router.put('/:id', validate(idSchema, 'params'), validate(updateClienteSchema), controller.atualizarCliente);
router.delete('/:id', validate(idSchema, 'params'), controller.deletarCliente);

export default router;

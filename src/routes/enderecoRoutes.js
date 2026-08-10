import { Router } from 'express';
import { EnderecoController } from '../controllers/enderecoController.js';
import { authenticate } from '../middlewares/auth.js';
import { validate } from '../middlewares/validate.js';
import { createEnderecoSchema, idSchema, listQuerySchema, updateEnderecoSchema } from '../schemas/apiSchemas.js';

const router = Router();
const controller = new EnderecoController();

router.use(authenticate);
router.get('/', validate(listQuerySchema, 'query'), controller.listarEnderecos);
router.get('/:id', validate(idSchema, 'params'), controller.buscarEnderecoPorId);
router.post('/', validate(createEnderecoSchema), controller.criarEndereco);
router.put('/:id', validate(idSchema, 'params'), validate(updateEnderecoSchema), controller.atualizarEndereco);
router.delete('/:id', validate(idSchema, 'params'), controller.deletarEndereco);

export default router;

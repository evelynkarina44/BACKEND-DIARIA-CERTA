import { Router } from 'express';
import { UsuarioController } from '../controllers/usuarioController.js';
import { authenticate } from '../middlewares/auth.js';
import { validate } from '../middlewares/validate.js';
import { createUsuarioSchema, idSchema, listQuerySchema, updateUsuarioSchema } from '../schemas/apiSchemas.js';

const router = Router();
const controller = new UsuarioController();

router.post('/', validate(createUsuarioSchema), controller.criarUsuario);
router.use(authenticate);
router.get('/', validate(listQuerySchema, 'query'), controller.listarUsuarios);
router.get('/:id', validate(idSchema, 'params'), controller.buscarUsuarioPorId);
router.put('/:id', validate(idSchema, 'params'), validate(updateUsuarioSchema), controller.atualizarUsuario);
router.delete('/:id', validate(idSchema, 'params'), controller.deletarUsuario);

export default router;

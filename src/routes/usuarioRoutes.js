import { express } from 'express';
import { UsuarioController } from '../controllers/usuarioController';
import { validate } from '../middlewares/validate';
import { createUsuarioSchema, updateUsuarioSchema, listUsuariosQuerySchema, usuarioIdSchema } from '../schemas/usuario/usuarioSchemas';

const router = express.Router();

const usuarioController = new UsuarioController();

router.get('/', validate(listUsuariosQuerySchema, "query"), usuarioController.listarUsuarios);

router.get('/:id_usuario', validate(usuarioIdSchema, "params"), usuarioController.buscarUsuarioPorId);

router.post('/', validate(createUsuarioSchema), usuarioController.criarUsuario);

router.put('/:id_usuario', validate(usuarioIdSchema, "params"), validate(updateUsuarioSchema), usuarioController.atualizarUsuario);

router.delete('/:id_usuario', validate(usuarioIdSchema, "params"), usuarioController.deletarUsuario);
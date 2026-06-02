import { express } from 'express';
import { UsuarioController } from '../controllers/usuarioController';

const router = express.Router();

router.get('/', UsuarioController.listarUsuarios);

router.get('/:id', UsuarioController.buscarUsuarioPorId);

router.post('/', UsuarioController.criarUsuario);

router.put('/:id', UsuarioController.atualizarUsuario);

router.delete('/:id', UsuarioController.deletarUsuario);
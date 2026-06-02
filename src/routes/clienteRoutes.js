import { express } from 'express';
import { ClienteController } from '../controllers/clienteController';

export const router = express.Router();

router.get('/', ClienteController.listarClientes);

router.get('/:id', ClienteController.buscarClientePorId);

router.post('/', ClienteController.criarCliente);

router.put('/:id', ClienteController.atualizarCliente);

router.delete('/:id', ClienteController.deletarCliente);
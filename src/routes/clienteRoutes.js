import { express } from 'express';
import { ClienteController } from '../controllers/clienteController';

export const router = express.Router();

const clienteController = new ClienteController();

router.get('/', clienteController.listarClientes);

router.get('/:id_cliente', clienteController.buscarClientePorId);

router.post('/', clienteController.criarCliente);

router.put('/:id_cliente', clienteController.atualizarCliente);

router.delete('/:id_cliente', clienteController.deletarCliente);
import { express } from 'express';
import { EnderecoController } from '../controllers/enderecoController';

const router = express.Router();

const enderecoController = new EnderecoController();

router.get('/', enderecoController.listarEnderecos);

router.get('/:id', enderecoController.buscarEnderecoPorId);

router.post('/', enderecoController.criarEndereco);

router.put('/:id', enderecoController.atualizarEndereco);

router.delete('/:id', enderecoController.deletarEndereco);
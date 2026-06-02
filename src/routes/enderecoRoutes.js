import { express } from 'express';
import { EnderecoController } from '../controllers/enderecoController';

const router = express.Router();

router.get('/', EnderecoController.listarEnderecos);

router.get('/:id', EnderecoController.buscarEnderecoPorId);

router.post('/', EnderecoController.criarEndereco);

router.put('/:id', EnderecoController.atualizarEndereco);

router.delete('/:id', EnderecoController.deletarEndereco);
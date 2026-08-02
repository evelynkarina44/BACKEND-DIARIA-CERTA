import { express } from 'express';
import { ServicoController } from '../controllers/servicoController';

const router = express.Router();

const servicoController = new ServicoController();

router.get('/', servicoController.listarServicos);

router.get('/:id', servicoController.buscarServicoPorId);

router.post('/', servicoController.criarServico);

router.put('/:id', servicoController.atualizarServico);

router.delete('/:id', servicoController.deletarServico);
import { express } from 'express';
import { DiaristaController } from '../controllers/diaristaController';

const router = express.Router();

const diaristaServicoController = new DiaristaServicoController();

router.get('/', diaristaServicoController.listarDiaristaServicos);

router.get('/:id_diarista_servico', diaristaServicoController.buscarDiaristaServicoPorId);

router.post('/', diaristaServicoController.criarDiaristaServico);

router.put('/:id_diarista_servico', diaristaServicoController.atualizarDiaristaServico);

router.delete('/:id_diarista_servico', diaristaServicoController.deletarDiaristaServico);
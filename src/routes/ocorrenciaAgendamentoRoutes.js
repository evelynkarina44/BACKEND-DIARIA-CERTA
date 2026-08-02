import { express } from 'express';
import { OcorrenciaAgendamentoController } from '../controllers/ocorrenciaAgendamentoController';

const router = express.Router();

const ocorrenciaAgendamentoController = new OcorrenciaAgendamentoController();

router.get('/', ocorrenciaAgendamentoController.listarOcorrenciasAgendamento);

router.get('/:id', ocorrenciaAgendamentoController.buscarOcorrenciaAgendamentoPorId);

router.post('/', ocorrenciaAgendamentoController.criarOcorrenciaAgendamento);

router.put('/:id', ocorrenciaAgendamentoController.atualizarOcorrenciaAgendamento);

router.delete('/:id', ocorrenciaAgendamentoController.deletarOcorrenciaAgendamento);
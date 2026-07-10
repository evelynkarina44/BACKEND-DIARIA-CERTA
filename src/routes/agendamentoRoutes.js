import { express } from 'express';
import { AgendamentoController } from '../controllers/AgendamentoController';

export const router = express.Router();

const agendamentoController = new AgendamentoController();

router.get('/', agendamentoController.listarAgendamento);

router.get('/:id', agendamentoController.buscarAgendamentoPorId);

router.post('/', agendamentoController.criarAgendamento);

router.put('/:id', agendamentoController.atualizarAgendamento);

router.delete('/:id', agendamentoController.deletarAgendamento);


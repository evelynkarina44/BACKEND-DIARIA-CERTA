import { express } from 'express';
import { AgendamentoServicoController } from '../controllers/AgendamentoServicoController';

export const router = express.Router();

const agendamentoServicoController = new AgendamentoServicoController();

router.get('/', agendamentoServicoController.listarAgendamentoServico);

router.get('/:id', agendamentoServicoController.buscarAgendamentoServicoPorId);

router.post('/', agendamentoServicoController.criarAgendamentoServico);

router.put('/:id', agendamentoServicoController.atualizarAgendamentoServico);

router.delete('/:id', agendamentoServicoController.deletarAgendamentoServico);


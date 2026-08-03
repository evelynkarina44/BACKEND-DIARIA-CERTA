import { express } from 'express';
import { ComboServicoController } from '../controllers/comboServicoController';

export const router = express.Router();

const comboServicoController = new ComboServicoController();

router.get('/', comboServicoController.listarComboServicos);

router.get('/:id', comboServicoController.buscarComboServicoPorId);

router.post('/', comboServicoController.criarComboServico);

router.put('/:id', comboServicoController.atualizarComboServico);

router.delete('/:id', comboServicoController.deletarComboServico);


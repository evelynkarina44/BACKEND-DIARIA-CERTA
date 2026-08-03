import { express } from 'express';
import { ComboBaseController } from '../controllers/comboBaseController';

export const router = express.Router();

const comboBaseController = new ComboBaseController();

router.get('/', comboBaseController.listarComboBases);

router.get('/:id', comboBaseController.buscarComboBasePorId);

router.post('/', comboBaseController.criarComboBase);

router.put('/:id', comboBaseController.atualizarComboBase);

router.delete('/:id', comboBaseController.deletarComboBase);


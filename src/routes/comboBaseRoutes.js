import { express } from 'express';
import { ComboBaseController } from '../controllers/comboBaseController';

export const router = express.Router();

router.get('/', ComboBaseController.listarComboBases);

router.get('/:id', ComboBaseController.buscarComboBasePorId);

router.post('/', ComboBaseController.criarComboBase);

router.put('/:id', ComboBaseController.atualizarComboBase);

router.delete('/:id', ComboBaseController.deletarComboBase);


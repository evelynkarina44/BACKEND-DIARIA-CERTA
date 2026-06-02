import { express } from 'express';
import { DiaristaController } from '../controllers/diaristaController';

const router = express.Router();

router.get('/', DiaristaController.listarDiaristas);

router.get('/:id', DiaristaController.buscarDiaristaPorId);

router.post('/', DiaristaController.criarDiarista);

router.put('/:id', DiaristaController.atualizarDiarista);

router.delete('/:id', DiaristaController.deletarDiarista);
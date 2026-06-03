import { express } from 'express';
import { DiaristaController } from '../controllers/diaristaController';

const router = express.Router();

const diaristaController = new DiaristaController();

router.get('/', diaristaController.listarDiaristas);

router.get('/:id_diarista', diaristaController.buscarDiaristaPorId);

router.post('/', diaristaController.criarDiarista);

router.put('/:id_diarista', diaristaController.atualizarDiarista);

router.delete('/:id_diarista', diaristaController.deletarDiarista);
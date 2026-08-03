import { express } from 'express';
import { DisponibilidadeDiaristaController } from '../controllers/disponibilidadeDiaristaController';

export const router = express.Router();

const disponibilidadeDiaristaController = new DisponibilidadeDiaristaController();

router.get('/', disponibilidadeDiaristaController.listarDisponibilidadeDiaristas);

router.get('/:id', disponibilidadeDiaristaController.buscarDisponibilidadeDiaristaPorId);

router.post('/', disponibilidadeDiaristaController.criarDisponibilidadeDiarista);

router.put('/:id', disponibilidadeDiaristaController.atualizarDisponibilidadeDiarista);

router.delete('/:id', disponibilidadeDiaristaController.deletarDisponibilidadeDiarista);


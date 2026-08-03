import { express } from 'express';
import { CheckinCheckoutController } from '../controllers/CheckinCheckoutController';

export const router = express.Router();

const checkinCheckoutController = new CheckinCheckoutController();

router.get('/', checkinCheckoutController.listarCheckinCheckout);

router.get('/:id', checkinCheckoutController.buscarCheckinCheckoutPorId);

router.post('/', checkinCheckoutController.criarCheckinCheckout);

router.put('/:id', checkinCheckoutController.atualizarCheckinCheckout);

router.delete('/:id', checkinCheckoutController.deletarCheckinCheckout);


import { CrudController } from './CrudController.js';
import { CreateCheckinCheckoutService } from '../services/checkinCheckout/CreateCheckinCheckoutService.js';
import { FindCheckinCheckoutService } from '../services/checkinCheckout/FindCheckinCheckoutService.js';
import { ListCheckinCheckoutService } from '../services/checkinCheckout/ListCheckinCheckoutService.js';
import { UpdateCheckinCheckoutService } from '../services/checkinCheckout/UpdateCheckinCheckoutService.js';
import { DeleteCheckinCheckoutService } from '../services/checkinCheckout/DeleteCheckinCheckoutService.js';

export class CheckinCheckoutController extends CrudController {
  constructor() {
    super({ services: { create: CreateCheckinCheckoutService, find: FindCheckinCheckoutService, list: ListCheckinCheckoutService, update: UpdateCheckinCheckoutService, delete: DeleteCheckinCheckoutService }, methods: { list: 'listarCheckins', find: 'buscarCheckinPorId', create: 'criarCheckin', update: 'atualizarCheckin', delete: 'deletarCheckin' }, resourceName: 'Check-in/check-out' });
  }
}

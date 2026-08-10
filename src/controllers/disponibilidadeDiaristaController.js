import { CrudController } from './CrudController.js';
import { CreateDisponibilidadeDiaristaService } from '../services/disponibilidadeDiarista/CreateDisponibilidadeDiaristaService.js';
import { FindDisponibilidadeDiaristaService } from '../services/disponibilidadeDiarista/FindDisponibilidadeDiaristaService.js';
import { ListDisponibilidadeDiaristaService } from '../services/disponibilidadeDiarista/ListDisponibilidadeDiaristaService.js';
import { UpdateDisponibilidadeDiaristaService } from '../services/disponibilidadeDiarista/UpdateDisponibilidadeDiaristaService.js';
import { DeleteDisponibilidadeDiaristaService } from '../services/disponibilidadeDiarista/DeleteDisponibilidadeDiaristaService.js';

export class DisponibilidadeDiaristaController extends CrudController {
  constructor() {
    super({ services: { create: CreateDisponibilidadeDiaristaService, find: FindDisponibilidadeDiaristaService, list: ListDisponibilidadeDiaristaService, update: UpdateDisponibilidadeDiaristaService, delete: DeleteDisponibilidadeDiaristaService }, methods: { list: 'listarDisponibilidades', find: 'buscarDisponibilidadePorId', create: 'criarDisponibilidade', update: 'atualizarDisponibilidade', delete: 'deletarDisponibilidade' }, resourceName: 'Disponibilidade' });
  }
}

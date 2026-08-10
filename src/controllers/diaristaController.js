import { CrudController } from './CrudController.js';
import { CreateDiaristaService } from '../services/diarista/CreateDiaristaService.js';
import { FindDiaristaService } from '../services/diarista/FindDiaristaService.js';
import { ListDiaristasService } from '../services/diarista/ListDiaristasService.js';
import { UpdateDiaristaService } from '../services/diarista/UpdateDiaristaService.js';
import { DeleteDiaristaService } from '../services/diarista/DeleteDiaristaService.js';

export class DiaristaController extends CrudController {
  constructor() {
    super({ services: { create: CreateDiaristaService, find: FindDiaristaService, list: ListDiaristasService, update: UpdateDiaristaService, delete: DeleteDiaristaService }, methods: { list: 'listarDiaristas', find: 'buscarDiaristaPorId', create: 'criarDiarista', update: 'atualizarDiarista', delete: 'deletarDiarista' }, resourceName: 'Diarista' });
  }
}

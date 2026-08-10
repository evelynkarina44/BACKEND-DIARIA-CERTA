import { CrudController } from './CrudController.js';
import { CreateDiaristaServicoService } from '../services/diaristaServico/CreateDiaristaServicoService.js';
import { FindDiaristaServicoService } from '../services/diaristaServico/FindDiaristaServicoService.js';
import { ListDiaristaServicosService } from '../services/diaristaServico/ListDiaristaServicoService.js';
import { UpdateDiaristaServicoService } from '../services/diaristaServico/UpdateDiaristaServicoService.js';
import { DeleteDiaristaServicoService } from '../services/diaristaServico/DeleteDiaristaServicoService.js';

export class DiaristaServicoController extends CrudController {
  constructor() {
    super({ services: { create: CreateDiaristaServicoService, find: FindDiaristaServicoService, list: ListDiaristaServicosService, update: UpdateDiaristaServicoService, delete: DeleteDiaristaServicoService }, methods: { list: 'listarDiaristaServicos', find: 'buscarDiaristaServicoPorId', create: 'criarDiaristaServico', update: 'atualizarDiaristaServico', delete: 'deletarDiaristaServico' }, resourceName: 'Serviço da diarista' });
  }
}

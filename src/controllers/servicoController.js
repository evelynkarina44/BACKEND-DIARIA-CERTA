import { CrudController } from './CrudController.js';
import { CreateServicoService } from '../services/servico/CreateServicoService.js';
import { FindServicoService } from '../services/servico/FindServicoService.js';
import { ListServicoService } from '../services/servico/ListServicoService.js';
import { UpdateServicoService } from '../services/servico/UpdateServicoService.js';
import { DeleteServicoService } from '../services/servico/DeleteServicoService.js';

export class ServicoController extends CrudController {
  constructor() {
    super({ services: { create: CreateServicoService, find: FindServicoService, list: ListServicoService, update: UpdateServicoService, delete: DeleteServicoService }, methods: { list: 'listarServicos', find: 'buscarServicoPorId', create: 'criarServico', update: 'atualizarServico', delete: 'deletarServico' }, resourceName: 'Serviço' });
  }
}

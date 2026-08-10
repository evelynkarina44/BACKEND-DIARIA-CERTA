import { CrudController } from './CrudController.js';
import { CreateComboServicoService } from '../services/comboServico/CreateComboServicoService.js';
import { FindComboServicoService } from '../services/comboServico/FindComboServicoService.js';
import { ListComboServicosService } from '../services/comboServico/ListComboServicoService.js';
import { UpdateComboServicoService } from '../services/comboServico/UpdateComboServicoService.js';
import { DeleteComboServicoService } from '../services/comboServico/DeleteComboServicoService.js';

export class ComboServicoController extends CrudController {
  constructor() {
    super({ services: { create: CreateComboServicoService, find: FindComboServicoService, list: ListComboServicosService, update: UpdateComboServicoService, delete: DeleteComboServicoService }, methods: { list: 'listarComboServicos', find: 'buscarComboServicoPorId', create: 'criarComboServico', update: 'atualizarComboServico', delete: 'deletarComboServico' }, resourceName: 'Serviço do combo' });
  }
}

import { CrudController } from './CrudController.js';
import { CreateComboBaseService } from '../services/comboBase/CreateComboBaseService.js';
import { FindComboBaseService } from '../services/comboBase/FindComboBaseService.js';
import { ListComboBasesService } from '../services/comboBase/ListComboBasesService.js';
import { UpdateComboBaseService } from '../services/comboBase/UpdateComboBaseService.js';
import { DeleteComboBaseService } from '../services/comboBase/DeleteComboBaseService.js';

export class ComboBaseController extends CrudController {
  constructor() {
    super({ services: { create: CreateComboBaseService, find: FindComboBaseService, list: ListComboBasesService, update: UpdateComboBaseService, delete: DeleteComboBaseService }, methods: { list: 'listarComboBases', find: 'buscarComboBasePorId', create: 'criarComboBase', update: 'atualizarComboBase', delete: 'deletarComboBase' }, resourceName: 'Combo base' });
  }
}

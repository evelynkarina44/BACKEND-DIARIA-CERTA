import { CrudController } from './CrudController.js';
import { CreateEnderecoService } from '../services/endereco/CreateEnderecoService.js';
import { FindEnderecoService } from '../services/endereco/FindEnderecoService.js';
import { ListEnderecosService } from '../services/endereco/ListEnderecoService.js';
import { UpdateEnderecoService } from '../services/endereco/UpdateEnderecoService.js';
import { DeleteEnderecoService } from '../services/endereco/DeleteEnderecoService.js';

export class EnderecoController extends CrudController {
  constructor() {
    super({ services: { create: CreateEnderecoService, find: FindEnderecoService, list: ListEnderecosService, update: UpdateEnderecoService, delete: DeleteEnderecoService }, methods: { list: 'listarEnderecos', find: 'buscarEnderecoPorId', create: 'criarEndereco', update: 'atualizarEndereco', delete: 'deletarEndereco' }, resourceName: 'Endereço' });
  }
}

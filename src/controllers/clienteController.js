import { CrudController } from './CrudController.js';
import { CreateClienteService } from '../services/cliente/CreateClienteService.js';
import { FindClienteService } from '../services/cliente/FindClienteService.js';
import { ListClientesService } from '../services/cliente/ListClientesService.js';
import { UpdateClienteService } from '../services/cliente/UpdateClienteService.js';
import { DeleteClienteService } from '../services/cliente/DeleteClienteService.js';

export class ClienteController extends CrudController {
  constructor() {
    super({ services: { create: CreateClienteService, find: FindClienteService, list: ListClientesService, update: UpdateClienteService, delete: DeleteClienteService }, methods: { list: 'listarClientes', find: 'buscarClientePorId', create: 'criarCliente', update: 'atualizarCliente', delete: 'deletarCliente' }, resourceName: 'Cliente' });
  }
}

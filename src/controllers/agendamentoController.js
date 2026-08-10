import { CrudController } from './CrudController.js';
import { CreateAgendamentoService } from '../services/agendamento/CreateAgendamentoService.js';
import { FindAgendamentoService } from '../services/agendamento/FindAgendamentoService.js';
import { ListAgendamentoService } from '../services/agendamento/ListAgendamentoService.js';
import { UpdateAgendamentoService } from '../services/agendamento/UpdateAgendamentoService.js';
import { DeleteAgendamentoService } from '../services/agendamento/DeleteAgendamentoService.js';

export class AgendamentoController extends CrudController {
  constructor() {
    super({ services: { create: CreateAgendamentoService, find: FindAgendamentoService, list: ListAgendamentoService, update: UpdateAgendamentoService, delete: DeleteAgendamentoService }, methods: { list: 'listarAgendamentos', find: 'buscarAgendamentoPorId', create: 'criarAgendamento', update: 'atualizarAgendamento', delete: 'deletarAgendamento' }, resourceName: 'Agendamento' });
  }
}

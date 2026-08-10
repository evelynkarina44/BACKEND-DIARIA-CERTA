import { CrudController } from './CrudController.js';
import { CreateAgendamentoServicoService } from '../services/agendamentoServico/CreateAgendamentoServicoService.js';
import { FindAgendamentoServicoService } from '../services/agendamentoServico/FindAgendamentoServicoService.js';
import { ListAgendamentoServicoService } from '../services/agendamentoServico/ListAgendamentoServicoService.js';
import { UpdateAgendamentoServicoService } from '../services/agendamentoServico/UpdateAgendamentoServicoService.js';
import { DeleteAgendamentoServicoService } from '../services/agendamentoServico/DeleteAgendamentoServicoService.js';

export class AgendamentoServicoController extends CrudController {
  constructor() {
    super({ services: { create: CreateAgendamentoServicoService, find: FindAgendamentoServicoService, list: ListAgendamentoServicoService, update: UpdateAgendamentoServicoService, delete: DeleteAgendamentoServicoService }, methods: { list: 'listarAgendamentoServicos', find: 'buscarAgendamentoServicoPorId', create: 'criarAgendamentoServico', update: 'atualizarAgendamentoServico', delete: 'deletarAgendamentoServico' }, resourceName: 'Serviço do agendamento' });
  }
}

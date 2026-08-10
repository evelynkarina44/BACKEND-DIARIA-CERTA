import { CrudController } from './CrudController.js';
import { CreateOcorrenciaAgendamentoService } from '../services/ocorrenciaAgendamento/CreateOcorrenciaAgendamentoService.js';
import { FindOcorrenciaAgendamentoService } from '../services/ocorrenciaAgendamento/FindOcorrenciaAgendamentoService.js';
import { ListOcorrenciaAgendamentoService } from '../services/ocorrenciaAgendamento/ListOcorrenciaAgendamentoService.js';
import { UpdateOcorrenciaAgendamentoService } from '../services/ocorrenciaAgendamento/UpdateOcorrenciaAgendamentoService.js';
import { DeleteOcorrenciaAgendamentoService } from '../services/ocorrenciaAgendamento/DeleteOcorrenciaAgendamentoService.js';

export class OcorrenciaAgendamentoController extends CrudController {
  constructor() {
    super({ services: { create: CreateOcorrenciaAgendamentoService, find: FindOcorrenciaAgendamentoService, list: ListOcorrenciaAgendamentoService, update: UpdateOcorrenciaAgendamentoService, delete: DeleteOcorrenciaAgendamentoService }, methods: { list: 'listarOcorrencias', find: 'buscarOcorrenciaPorId', create: 'criarOcorrencia', update: 'atualizarOcorrencia', delete: 'deletarOcorrencia' }, resourceName: 'Ocorrência' });
  }
}

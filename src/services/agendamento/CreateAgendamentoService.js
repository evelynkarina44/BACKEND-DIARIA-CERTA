import { AgendamentoWorkflowService } from './AgendamentoWorkflowService.js';
export class CreateAgendamentoService {
  constructor(workflow = new AgendamentoWorkflowService()) { this.workflow = workflow; }
  execute(data, auth) { return this.workflow.create(data, auth); }
}

import { AgendamentoWorkflowService } from './AgendamentoWorkflowService.js';
export class FindAgendamentoService {
  constructor(workflow = new AgendamentoWorkflowService()) { this.workflow = workflow; }
  execute(id, auth) { return this.workflow.find(id, auth); }
}

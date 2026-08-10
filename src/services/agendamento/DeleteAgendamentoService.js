import { AgendamentoWorkflowService } from './AgendamentoWorkflowService.js';
export class DeleteAgendamentoService {
  constructor(workflow = new AgendamentoWorkflowService()) { this.workflow = workflow; }
  execute(id, auth) { return this.workflow.cancel(id, auth); }
}

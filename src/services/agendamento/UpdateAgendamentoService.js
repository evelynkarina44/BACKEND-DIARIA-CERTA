import { AgendamentoWorkflowService } from './AgendamentoWorkflowService.js';
export class UpdateAgendamentoService {
  constructor(workflow = new AgendamentoWorkflowService()) { this.workflow = workflow; }
  execute(id, data, auth) { return this.workflow.updateNotes(id, data, auth); }
}

import { AgendamentoWorkflowService } from './AgendamentoWorkflowService.js';
export class ListAgendamentoService {
  constructor(workflow = new AgendamentoWorkflowService()) { this.workflow = workflow; }
  execute(query, auth) { return this.workflow.list(query, auth); }
}

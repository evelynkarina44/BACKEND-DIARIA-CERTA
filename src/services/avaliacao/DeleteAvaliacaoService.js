import { AvaliacaoWorkflowService } from './AvaliacaoWorkflowService.js';
export class DeleteAvaliacaoService {
  constructor(workflow = new AvaliacaoWorkflowService()) { this.workflow = workflow; }
  execute(id, auth) { return this.workflow.delete(id, auth); }
}

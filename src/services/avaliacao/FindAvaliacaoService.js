import { AvaliacaoWorkflowService } from './AvaliacaoWorkflowService.js';
export class FindAvaliacaoService {
  constructor(workflow = new AvaliacaoWorkflowService()) { this.workflow = workflow; }
  execute(id, auth) { return this.workflow.find(id, auth); }
}

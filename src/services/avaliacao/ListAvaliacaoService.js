import { AvaliacaoWorkflowService } from './AvaliacaoWorkflowService.js';
export class ListAvaliacaoService {
  constructor(workflow = new AvaliacaoWorkflowService()) { this.workflow = workflow; }
  execute(query, auth) { return this.workflow.list(query, auth); }
}

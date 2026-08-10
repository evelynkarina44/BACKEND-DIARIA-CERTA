import { AvaliacaoWorkflowService } from './AvaliacaoWorkflowService.js';
export class UpdateAvaliacaoService {
  constructor(workflow = new AvaliacaoWorkflowService()) { this.workflow = workflow; }
  execute(id, data, auth) { return this.workflow.update(id, data, auth); }
}

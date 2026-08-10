import { AvaliacaoWorkflowService } from './AvaliacaoWorkflowService.js';
export class CreateAvaliacaoService {
  constructor(workflow = new AvaliacaoWorkflowService()) { this.workflow = workflow; }
  execute(data, auth) { return this.workflow.create(data, auth); }
}

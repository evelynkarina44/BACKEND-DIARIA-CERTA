import { AgendamentoWorkflowService } from '../services/agendamento/AgendamentoWorkflowService.js';

const service = new AgendamentoWorkflowService();

export class AgendamentoWorkflowController {
  async estimar(req, res) { return res.status(200).json(await service.estimate(req.body, req.auth)); }
  async aceitar(req, res) { return res.status(200).json(await service.accept(req.params.id, req.auth)); }
  async recusar(req, res) { return res.status(200).json(await service.reject(req.params.id, req.auth)); }
  async cancelar(req, res) { return res.status(200).json(await service.cancel(req.params.id, req.auth, req.body?.descricao)); }
}

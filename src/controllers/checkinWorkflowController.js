import { CheckinCheckoutWorkflowService } from '../services/checkinCheckout/CheckinCheckoutWorkflowService.js';

const service = new CheckinCheckoutWorkflowService();

export class CheckinWorkflowController {
  async buscarPorAgendamento(req, res) { return res.status(200).json(await service.findByAppointment(req.params.id, req.auth)); }
  async solicitar(req, res) { return res.status(200).json(await service.requestCheckin(req.params.id, req.auth)); }
  async confirmarPagamento(req, res) { return res.status(200).json(await service.confirmPayment(req.params.id, req.auth)); }
  async checkout(req, res) { return res.status(200).json(await service.checkout(req.params.id, req.auth)); }
}

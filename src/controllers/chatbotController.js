// PEDRO | ETAPA 2 — Controller simples: recebe HTTP e chama a Service.
// Próximo arquivo: ChatbotService.js, método message().
import { ChatbotService } from '../services/chatbot/ChatbotService.js';

const service = new ChatbotService();
export class ChatbotController {
  async listarConversas(req, res) { return res.status(200).json(await service.list(req.query, req.auth)); }
  async criarConversa(req, res) { return res.status(200).json(await service.create(req.body, req.auth)); }
  async buscarConversa(req, res) { return res.status(200).json(await service.get(req.params.id, req.auth)); }
  // Mostrar id da conversa, corpo da mensagem e sessão autenticada sendo encaminhados ao Service.
  async enviarMensagem(req, res) { return res.status(200).json(await service.message(req.params.id, req.body, req.auth)); }
  async confirmarProposta(req, res) { return res.status(200).json(await service.confirm(req.params.id, req.auth)); }
  async cancelarProposta(req, res) { return res.status(200).json(await service.cancel(req.params.id, req.auth)); }
}

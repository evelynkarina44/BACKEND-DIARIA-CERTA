import { ListServicosService } from "../services/servico/ListServicoService.js";

const service = new ListServicosService();

export class ServicoController {
  async list(req, res) {
    return res.status(200).json({ data: await service.execute() });
  }
}

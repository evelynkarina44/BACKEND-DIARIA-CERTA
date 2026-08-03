import { FindDiaristaService } from "../services/diarista/FindDiaristaService.js";
import { ListDiaristasService } from "../services/diarista/ListDiaristasService.js";

const findService = new FindDiaristaService();
const listService = new ListDiaristasService();

export class DiaristaController {
  async list(req, res) {
    const result = await listService.execute(req.validated.query);
    return res.status(200).json(result);
  }

  async find(req, res) {
    const worker = await findService.execute(req.params.id_diarista);
    return res.status(200).json({ data: worker });
  }
}

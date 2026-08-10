import { DiaristaStatsService } from '../services/diarista/DiaristaStatsService.js';

const service = new DiaristaStatsService();

export class DiaristaStatsController {
  async buscar(req, res) { return res.status(200).json(await service.execute(req.params.id, req.auth)); }
}

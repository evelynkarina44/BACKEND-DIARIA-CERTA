import { DiaristaServicoRepository } from '../../repositories/diaristaServicoRepository.js';

const diaristaServicoRepository = new DiaristaServicoRepository();

export class UpdateDiaristaServicoService {
  async execute(id, data) {
    return diaristaServicoRepository.update(id, data);
  }
}

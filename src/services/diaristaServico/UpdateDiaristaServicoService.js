import { diaristaServicoRepository } from './DiaristaServicoRepository';

const diaristaServicoRepository = new diaristaServicoRepository();

export class UpdateDiaristaServicoService {
  async execute(id, data) {
    return diaristaServicoRepository.update(id, data);
  }
}
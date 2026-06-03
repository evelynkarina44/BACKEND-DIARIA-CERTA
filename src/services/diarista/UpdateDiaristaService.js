import { diaristaRepository } from './DiaristaRepository';

const diaristaRepository = new diaristaRepository();

export class UpdateDiaristaService {
  async execute(id_diarista, data) {
    return diaristaRepository.update(id_diarista, data);
  }
}
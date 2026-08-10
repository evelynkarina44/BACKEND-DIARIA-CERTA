import { ComboServicoRepository } from "../../repositories/comboServicoRepository.js";

const comboServicoRepository = new ComboServicoRepository();

export class UpdateComboServicoService {
  async execute(id, data) {
    return comboServicoRepository.update(id, data);
  }
}
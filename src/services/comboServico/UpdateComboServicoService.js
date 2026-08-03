import { ComboServicoRepository } from "../../repositories/comboServicoRepository";

const comboServicoRepository = new ComboServicoRepository();

export class UpdateComboServicoService {
  async execute(id, data) {
    return comboServicoRepository.update(id, data);
  }
}
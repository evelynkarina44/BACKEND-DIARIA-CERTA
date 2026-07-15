import { ComboServicoRepository } from "../../repositories/comboServicoRepository";

const comboServicoRepository = new ComboServicoRepository();

export class FindComboServicoService {
  async execute(id) {
    return comboServicoRepository.findById(id);
  }
}
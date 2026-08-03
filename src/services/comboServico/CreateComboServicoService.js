import { ComboServicoRepository } from "../../repositories/comboServicoRepository";

const comboServicoRepository = new ComboServicoRepository();

export class CreateComboServicoService {
  async execute(data) {
    return comboServicoRepository.create(data);
  }
}
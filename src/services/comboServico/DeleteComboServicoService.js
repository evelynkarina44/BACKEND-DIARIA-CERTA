import { ComboServicoRepository } from "../../repositories/comboServicoRepository";

const comboServicoRepository = new ComboServicoRepository();

export class DeleteComboServicoService {
  async execute(id) {
    return comboServicoRepository.delete(id);
  }
}
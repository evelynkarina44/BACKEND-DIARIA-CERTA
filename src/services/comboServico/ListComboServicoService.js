import { ComboServicoRepository } from "../../repositories/comboServicoRepository.js";

const comboServicoRepository = new ComboServicoRepository();

export class ListComboServicosService {
  async execute() {
    return comboServicoRepository.findAll();
  }
}
import { ComboServicoRepository } from "../../repositories/comboServicoRepository";

const comboServicoRepository = new ComboServicoRepository();

export class ListComboServicosService {
  async execute() {
    return comboServicoRepository.findAll();
  }
}
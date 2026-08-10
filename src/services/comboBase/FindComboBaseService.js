import { ComboBaseRepository } from "../../repositories/comboBaseRepository.js";

const comboBaseRepository = new ComboBaseRepository();

export class FindComboBaseService {
  async execute(id) {
    return comboBaseRepository.findById(id);
  }
}
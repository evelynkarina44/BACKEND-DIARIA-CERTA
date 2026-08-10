import { ComboBaseRepository } from "../../repositories/comboBaseRepository.js";

const comboBaseRepository = new ComboBaseRepository();

export class UpdateComboBaseService {
  async execute(id, data) {
    return comboBaseRepository.update(id, data);
  }
}
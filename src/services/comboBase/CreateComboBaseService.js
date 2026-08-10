import { ComboBaseRepository } from "../../repositories/comboBaseRepository.js";

const comboBaseRepository = new ComboBaseRepository();

export class CreateComboBaseService {
  async execute(data) {
    return comboBaseRepository.create(data);
  }
}
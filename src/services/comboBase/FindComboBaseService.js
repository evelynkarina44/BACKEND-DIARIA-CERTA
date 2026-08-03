import { ComboBaseRepository } from "../../repositories/comboBaseRepository";

const comboBaseRepository = new ComboBaseRepository();

export class FindComboBaseService {
  async execute(id) {
    return comboBaseRepository.findById(id);
  }
}
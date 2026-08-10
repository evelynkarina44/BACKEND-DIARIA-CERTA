import { ComboBaseRepository } from "../../repositories/comboBaseRepository.js";

const comboBaseRepository = new ComboBaseRepository();

export class ListComboBasesService {
  async execute() {
    return comboBaseRepository.findAll();
  }
}
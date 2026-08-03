import { ComboBaseRepository } from "../../repositories/comboBaseRepository";

const comboBaseRepository = new ComboBaseRepository();

export class ListComboBasesService {
  async execute() {
    return comboBaseRepository.findAll();
  }
}
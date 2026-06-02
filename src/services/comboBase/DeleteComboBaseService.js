import { ComboBaseRepository } from "../../repositories/comboBaseRepository";

const comboBaseRepository = new ComboBaseRepository();

export class DeleteComboBaseService {
  async execute(id) {
    return comboBaseRepository.delete(id);
  }
}
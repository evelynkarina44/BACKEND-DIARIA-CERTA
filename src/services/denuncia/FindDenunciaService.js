import { DenunciaRepository } from "../../repositories/denunciaRepository";

const denunciaRepository = new DenunciaRepository();

export class FindDenunciaService {
  async execute(id) {
    return denunciaRepository.findById(id);
  }
}
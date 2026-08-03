import { DenunciaRepository } from "../../repositories/denunciaRepository";

const denunciaRepository = new DenunciaRepository();

export class DeleteDenunciaService {
  async execute(id) {
    return denunciaRepository.delete(id);
  }
}
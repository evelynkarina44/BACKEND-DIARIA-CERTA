import { DenunciaRepository } from "../../repositories/denunciaRepository";

const denunciaRepository = new DenunciaRepository();

export class CreateDenunciaService {
  async execute(data) {
    return denunciaRepository.create(data);
  }
}
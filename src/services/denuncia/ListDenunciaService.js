import { DenunciaRepository } from "../../repositories/denunciaRepository";

const denunciaRepository = new DenunciaRepository();

export class ListDenunciasService {
  async execute() {
    return denunciaRepository.findAll();
  }
}
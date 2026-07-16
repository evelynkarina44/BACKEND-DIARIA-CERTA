import { EnderecoRepository } from "../../repositories/enderecoRepository";

const denunciaRepository = new DenunciaRepository();

export class UpdateDenunciaService {
  async execute(id, data) {
    return denunciaRepository.update(id, data);
  }
}
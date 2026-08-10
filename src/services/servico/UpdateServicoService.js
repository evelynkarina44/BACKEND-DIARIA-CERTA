import { ServicoRepository } from "../../repositories/servicoRepository.js";

const servicoRepository = new ServicoRepository();

export class UpdateServicoService {
  async execute(id, data) {
    return servicoRepository.update(id, data);
  }
}
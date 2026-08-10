import { ServicoRepository } from "../../repositories/servicoRepository.js";

const servicoRepository = new ServicoRepository();

export class FindServicoService {
  async execute(id) {
    return servicoRepository.findById(id);
  }
}
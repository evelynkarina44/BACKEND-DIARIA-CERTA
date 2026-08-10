import { ServicoRepository } from "../../repositories/servicoRepository.js";

const servicoRepository = new ServicoRepository();

export class ListServicoService {
  async execute() {
    return servicoRepository.findAll();
  }
}

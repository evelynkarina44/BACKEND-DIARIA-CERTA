import { ServicoRepository } from "../../repositories/servicoRepository.js";

const servicoRepository = new ServicoRepository();

export class CreateServicoService {
  async execute(data) {
    return servicoRepository.create(data);
  }
}
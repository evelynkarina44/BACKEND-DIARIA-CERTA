import { ServicoRepository } from "../../repositories/servicoRepository";

const servicoRepository = new ServicoRepository();

export class ListServicosService {
  async execute() {
    return servicoRepository.findAll();
  }
}
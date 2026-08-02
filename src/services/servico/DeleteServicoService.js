import { ServicoRepository } from "../../repositories/servicoRepository";

const servicoRepository = new ServicoRepository();

export class DeleteServicoService {
  async execute(id) {
    return servicoRepository.delete(id);
  }
}

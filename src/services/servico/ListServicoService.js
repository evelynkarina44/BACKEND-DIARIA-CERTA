import { ServicoRepository } from "../../repositories/servicoRepository.js";

const repository = new ServicoRepository();

export class ListServicosService {
  execute() {
    return repository.findAll();
  }
}

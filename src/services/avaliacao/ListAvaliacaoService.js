import { AvaliacaoRepository } from "../../repositories/avaliacaoRepository";

const avaliacaoRepository = new AvaliacaoRepository();

export class ListAvaliacaoService {
  async execute() {
    return avaliacaoRepository.list();
  }
}

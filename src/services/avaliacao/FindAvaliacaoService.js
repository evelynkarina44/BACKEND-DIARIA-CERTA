import { AvaliacaoRepository } from "../../repositories/avaliacaoRepository";

const avaliacaoRepository = new AvaliacaoRepository();

export class FindAvaliacaoService {
  async execute(id_avaliacao) {
    return avaliacaoRepository.findById(id_avaliacao);
  }
}
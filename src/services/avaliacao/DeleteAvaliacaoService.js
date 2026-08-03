import { AvaliacaoRepository } from "../../repositories/avaliacaoRepository";

const avaliacaoRepository = new AvaliacaoRepository();

export class DeleteAvaliacaoService {
  async execute(id_avaliacao) {
    return avaliacaoRepository.delete(id_avaliacao);
  }
}
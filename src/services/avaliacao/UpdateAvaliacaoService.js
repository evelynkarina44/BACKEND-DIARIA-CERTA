import { AvaliacaoRepository } from "../../repositories/avaliacaoRepository";

const avaliacaoRepository = new AvaliacaoRepository();

export class UpdateAvaliacaoService {
  async execute(id, data) {
    return avaliacaoRepository.update(id, data);
  }
}
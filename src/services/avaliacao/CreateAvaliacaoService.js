import { AvaliacaoRepository } from "../../repositories/avaliacaoRepository";

const avaliacaoRepository = new AvaliacaoRepository();

export class CreateAvaliacaoService {
  async execute(data) {
    return avaliacaoRepository.create(data);
  }
}
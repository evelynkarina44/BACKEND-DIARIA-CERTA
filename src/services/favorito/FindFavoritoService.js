import { FavoritoRepository } from "../../repositories/favoritoRepository";

const favoritoRepository = new FavoritoRepository();

export class FindFavoritoService {
  async execute(id) {
    return favoritoRepository.findById(id);
  }
}
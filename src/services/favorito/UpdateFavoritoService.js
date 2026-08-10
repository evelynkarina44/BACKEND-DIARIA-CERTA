import { FavoritoRepository } from "../../repositories/favoritoRepository.js";

const favoritoRepository = new FavoritoRepository();

export class UpdateFavoritoService {
  async execute(id, data) {
    return favoritoRepository.update(id, data);
  }
}
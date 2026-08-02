import { FavoritoRepository } from "../../repositories/favoritoRepository";

const favoritoRepository = new FavoritoRepository();

export class UpdateFavoritoService {
  async execute(id, data) {
    return favoritoRepository.update(id, data);
  }
}
import { FavoritoRepository } from "../../repositories/favoritoRepository";

const favoritoRepository = new FavoritoRepository();

export class DeleteFavoritoService {
  async execute(id) {
    return favoritoRepository.delete(id);
  }
}
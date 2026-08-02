import { FavoritoRepository } from "../../repositories/favoritoRepository";

const favoritoRepository = new FavoritoRepository();

export class ListFavoritosService {
  async execute() {
    return favoritoRepository.findAll();
  }
}
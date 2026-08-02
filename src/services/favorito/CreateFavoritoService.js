import { FavoritoRepository } from "../../repositories/favoritoRepository";

const favoritoRepository = new FavoritoRepository();

export class CreateFavoritoService {
  async execute(data) {
    return favoritoRepository.create(data);
  }
}
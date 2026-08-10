import { FavoritoRepository } from '../../repositories/favoritoRepository.js';
import { ForbiddenError, NotFoundError } from '../../errors/index.js';

export class DeleteFavoritoService {
  constructor(repository = new FavoritoRepository()) { this.repository = repository; }
  async execute(id, auth) {
    const favorite = await this.repository.findById(id);
    if (!favorite) throw new NotFoundError('Favorito não encontrado');
    if (favorite.id_cliente !== auth?.id_cliente) throw new ForbiddenError('Favorito pertence a outro cliente');
    return this.repository.delete(id);
  }
}

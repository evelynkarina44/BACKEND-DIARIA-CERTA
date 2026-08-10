import { FavoritoRepository } from '../../repositories/favoritoRepository.js';
import { ForbiddenError } from '../../errors/index.js';

export class FindFavoritoService {
  constructor(repository = new FavoritoRepository()) { this.repository = repository; }
  async execute(id, auth) {
    const favorite = await this.repository.findById(id, { include: { diarista: { include: { usuario: { select: { nome: true, foto_perfil: true } } } } } });
    if (favorite && favorite.id_cliente !== auth?.id_cliente) throw new ForbiddenError('Favorito pertence a outro cliente');
    return favorite;
  }
}

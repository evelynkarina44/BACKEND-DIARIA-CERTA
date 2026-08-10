import { FavoritoRepository } from '../../repositories/favoritoRepository.js';
import { ForbiddenError } from '../../errors/index.js';

export class CreateFavoritoService {
  constructor(repository = new FavoritoRepository()) { this.repository = repository; }
  execute(data, auth) {
    if (!auth?.id_cliente) throw new ForbiddenError('É necessário um perfil de cliente');
    return this.repository.create({ id_cliente: auth.id_cliente, id_diarista: data.id_diarista }, { include: { diarista: { include: { usuario: { select: { nome: true, foto_perfil: true } } } } } });
  }
}

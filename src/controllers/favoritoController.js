import { CrudController } from './CrudController.js';
import { CreateFavoritoService } from '../services/favorito/CreateFavoritoService.js';
import { FindFavoritoService } from '../services/favorito/FindFavoritoService.js';
import { ListFavoritoService } from '../services/favorito/ListFavoritoService.js';
import { UpdateFavoritoService } from '../services/favorito/UpdateFavoritoService.js';
import { DeleteFavoritoService } from '../services/favorito/DeleteFavoritoService.js';

export class FavoritoController extends CrudController {
  constructor() {
    super({ services: { create: CreateFavoritoService, find: FindFavoritoService, list: ListFavoritoService, update: UpdateFavoritoService, delete: DeleteFavoritoService }, methods: { list: 'listarFavoritos', find: 'buscarFavoritoPorId', create: 'criarFavorito', update: 'atualizarFavorito', delete: 'deletarFavorito' }, resourceName: 'Favorito' });
  }
}

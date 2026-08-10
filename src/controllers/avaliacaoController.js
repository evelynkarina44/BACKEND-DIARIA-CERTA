import { CrudController } from './CrudController.js';
import { CreateAvaliacaoService } from '../services/avaliacao/CreateAvaliacaoService.js';
import { FindAvaliacaoService } from '../services/avaliacao/FindAvaliacaoService.js';
import { ListAvaliacaoService } from '../services/avaliacao/ListAvaliacaoService.js';
import { UpdateAvaliacaoService } from '../services/avaliacao/UpdateAvaliacaoService.js';
import { DeleteAvaliacaoService } from '../services/avaliacao/DeleteAvaliacaoService.js';

export class AvaliacaoController extends CrudController {
  constructor() {
    super({ services: { create: CreateAvaliacaoService, find: FindAvaliacaoService, list: ListAvaliacaoService, update: UpdateAvaliacaoService, delete: DeleteAvaliacaoService }, methods: { list: 'listarAvaliacoes', find: 'buscarAvaliacaoPorId', create: 'criarAvaliacao', update: 'atualizarAvaliacao', delete: 'deletarAvaliacao' }, resourceName: 'Avaliação' });
  }
}

import { CrudController } from './CrudController.js';
import { CreateDenunciaService } from '../services/denuncia/CreateDenunciaService.js';
import { FindDenunciaService } from '../services/denuncia/FindDenunciaService.js';
import { ListDenunciasService } from '../services/denuncia/ListDenunciaService.js';
import { UpdateDenunciaService } from '../services/denuncia/UpdateDenunciaService.js';
import { DeleteDenunciaService } from '../services/denuncia/DeleteDenunciaService.js';

export class DenunciaController extends CrudController {
  constructor() {
    super({ services: { create: CreateDenunciaService, find: FindDenunciaService, list: ListDenunciasService, update: UpdateDenunciaService, delete: DeleteDenunciaService }, methods: { list: 'listarDenuncias', find: 'buscarDenunciaPorId', create: 'criarDenuncia', update: 'atualizarDenuncia', delete: 'deletarDenuncia' }, resourceName: 'Denúncia' });
  }
}

import { CrudController } from './CrudController.js';
import { CreateUsuarioService } from '../services/usuario/CreateUsuarioService.js';
import { FindUsuarioService } from '../services/usuario/FindUsuarioService.js';
import { ListUsuariosService } from '../services/usuario/ListUsuariosService.js';
import { UpdateUsuarioService } from '../services/usuario/UpdateUsuarioService.js';
import { DeleteUsuarioService } from '../services/usuario/DeleteUsuarioService.js';

export class UsuarioController extends CrudController {
  constructor() {
    super({ services: { create: CreateUsuarioService, find: FindUsuarioService, list: ListUsuariosService, update: UpdateUsuarioService, delete: DeleteUsuarioService }, methods: { list: 'listarUsuarios', find: 'buscarUsuarioPorId', create: 'criarUsuario', update: 'atualizarUsuario', delete: 'deletarUsuario' }, resourceName: 'Usuário' });
  }
}

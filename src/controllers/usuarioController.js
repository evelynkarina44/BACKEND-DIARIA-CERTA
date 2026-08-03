import { CreateUsuarioService } from '../services/usuario/CreateUsuarioService';
import { FindUsuarioService } from '../services/usuario/FindUsuarioService';
import { UpdateUsuarioService } from '../services/usuario/UpdateUsuarioService';
import { DeleteUsuarioService } from '../services/usuario/DeleteUsuarioService';
import { ListUsuariosService } from '../services/usuario/ListUsuariosService';

import { NotFoundError } from "../errors/NotFoundError";
import { BadRequestError } from '../errors/BadRequestError';

export class UsuarioController {

    async listarUsuarios(req, res) {
        try {
            const service = new ListUsuariosService();
            const users = await service.execute();
            return res.status(200).json(users);
        } catch (error) {
            throw new NotFoundError('Usuário não encontrado');
        }
    }

    async buscarUsuarioPorId(req, res) {
        try {
            const { id_usuario } = req.params;
            const service = new FindUsuarioService();
            const user = await service.execute(id_usuario);
            if (!user) {
                throw new NotFoundError('Usuário não encontrado');
            }
            return res.status(200).json(user);
        } catch (error) {
            throw new BadRequestError('Usuário não encontrado');
        }
    }

    async criarUsuario(req, res) {
        try {
            const service = new CreateUsuarioService();
            const user = await service.execute(req.validatedData);
            return res.status(201).json(user);
        } catch (error) {
            throw new BadRequestError('Erro ao criar usuário');
        }
    }

    async atualizarUsuario(req, res) {
        try {
            const { id_usuario } = req.params;
            const service = new UpdateUsuarioService();
            const user = await service.execute(id_usuario, req.validatedData);
            return res.status(200).json(user);
        } catch (error) {
            throw new BadRequestError('Erro ao atualizar usuário');
        }
    }

    async deletarUsuario(req, res) {
        try {
            const { id_usuario } = req.params;
            const service = new DeleteUsuarioService();
            const user = await service.execute(id_usuario);
            return res.status(200).json(user);
        } catch (error) {
            throw new BadRequestError('Erro ao excluir usuário');
        }
    }
}
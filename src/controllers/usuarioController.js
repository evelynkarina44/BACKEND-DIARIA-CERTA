import { CreateUsuarioService } from '../services/usuario/CreateUsuarioService';
import { FindUsuarioService } from '../services/usuario/FindUsuarioService';
import { UpdateUsuarioService } from '../services/usuario/UpdateUsuarioService';
import { DeleteUsuarioService } from '../services/usuario/DeleteUsuarioService';
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
            const { id } = req.params;
            const service = new FindUsuarioService();
            const user = await service.execute(id);
            if (!user) {
                throw new NotFoundError('Usuário não encontrado');
            }
            return res.status(200).json(user);
        } catch (error) {
            throw new BadRequestError('Usuário não encontrado');
        }
    }

    async createUsuario(req, res) {
        try {
            const service = new CreateUsuarioService();
            const user = await service.execute(req.validatedData);
            return res.status(201).json(user);
        } catch (error) {
            throw new BadRequestError('Erro ao criar usuário');
        }
    }

    async updateUsuario(req, res) {
        try {
            const { id } = req.params;
            const service = new UpdateUsuarioService();
            const user = await service.execute(id, req.validatedData);
            return res.status(200).json(user);
        } catch (error) {
            throw new BadRequestError('Erro ao atualizar usuário');
        }
    }

    async deleteUsuario(req, res) {
        try {
            const { id } = req.params;
            const service = new DeleteUsuarioService();
            const user = await service.execute(id);
            return res.status(200).json(user);
        } catch (error) {
            throw new BadRequestError('Erro ao excluir usuário');
        }
    }
}
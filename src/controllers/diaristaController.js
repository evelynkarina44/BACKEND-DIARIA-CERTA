import { CreateDiaristaService } from '../services/diarista/CreateDiaristaService';
import { FindDiaristaService } from '../services/diarista/FindDiaristaService';
import { ListDiaristasService } from '../services/diarista/ListDiaristasService';
import { UpdateDiaristaService } from '../services/diarista/UpdateDiaristaService';
import { DeleteDiaristaService } from '../services/diarista/DeleteDiaristaService';

import { NotFoundError } from "../errors/NotFoundError";
import { BadRequestError } from '../errors/BadRequestError';
import { FindDiaristaByIdUsuarioService } from '../services/diarista/FindDiaristaByIdUsuarioService';

export class DiaristaController {

    async listarDiaristas(req, res) {
        try {
            const service = new ListDiaristasService();
            const diaristas = await service.execute();
            return res.status(200).json(diaristas);
        } catch (error) {
            throw new BadRequestError('Erro ao listar diaristas');
        }
    }

    async buscarDiaristaPorId(req, res) {
        try {
            const { id_diarista } = req.params;
            const service = new FindDiaristaService();
            const diarista = await service.execute(id_diarista);
            if (!diarista) {
                throw new NotFoundError('Diarista não encontrado');
            }
            return res.status(200).json(diarista);
        } catch (error) {
            throw new BadRequestError('Erro ao buscar diarista');
        }
    }

    async buscarDiaristaPorIdUsuario(req, res) {
        try {
            const { id_usuario } = req.params;
            const service = new FindDiaristaByIdUsuarioService();
            const diarista = await service.execute(id_usuario);
            if (!diarista) {
                throw new NotFoundError('Diarista não encontrado');
            }
            return res.status(200).json(diarista);
        } catch (error) {
            throw new BadRequestError('Erro ao buscar diarista');
        }
    }

    async criarDiarista(req, res) {
        try {
            const service = new CreateDiaristaService();
            const diaristaById = new FindDiaristaByIdUsuarioService();

            const body = req.body;

            const verifyDiaristaExists = diaristaById.execute(body.id_usuario);

            if (!verifyDiaristaExists) {
                throw new ConflictError(
                    "Usuário já tem um diarista cadastrado"
                )
            }

            const diarista = await service.execute(req.body);
            return res.status(201).json(diarista);
        } catch (error) {
            throw new BadRequestError('Erro ao criar diarista');
        }
    }

    async atualizarDiarista(req, res) {
        try {
            const { id_diarista } = req.params;
            const service = new UpdateDiaristaService();
            const diarista = await service.execute(id_diarista, req.body);
            return res.status(200).json(diarista);
        } catch (error) {
            throw new BadRequestError('Erro ao atualizar diarista');
        }
    }

    async deletarDiarista(req, res) {
        try {
            const { id_diarista } = req.params;
            const service = new DeleteDiaristaService();
            const diarista = await service.execute(id_diarista);
            return res.status(200).json(diarista);
        } catch (error) {
            throw new BadRequestError('Erro ao excluir diarista');
        }
    }
}
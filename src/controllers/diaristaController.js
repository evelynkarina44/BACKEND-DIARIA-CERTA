import { CreateDiaristaService } from '../services/diarista/CreateDiaristaService';
import { FindDiaristaService } from '../services/diarista/FindDiaristaService';
import { ListDiaristasService } from '../services/diarista/ListDiaristasService';
import { UpdateDiaristaService } from '../services/diarista/UpdateDiaristaService';
import { DeleteDiaristaService } from '../services/diarista/DeleteDiaristaService';

import { NotFoundError } from "../errors/NotFoundError";
import { BadRequestError } from '../errors/BadRequestError';

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
            const { id } = req.params;
            const service = new FindDiaristaService();
            const diarista = await service.execute(id);
            if (!diarista) {
                throw new NotFoundError('Diarista não encontrado');
            }
            return res.status(200).json(diarista);
        } catch (error) {
            throw new BadRequestError('Erro ao buscar diarista');
        }
    }

    async createDiarista(req, res) {
        try {
            const service = new CreateDiaristaService();
            const diarista = await service.execute(req.validatedData);
            return res.status(201).json(diarista);
        } catch (error) {
            throw new BadRequestError('Erro ao criar diarista');
        }
    }

    async updateDiarista(req, res) {
        try {
            const { id } = req.params;
            const service = new UpdateDiaristaService();
            const diarista = await service.execute(id, req.validatedData);
            return res.status(200).json(diarista);
        } catch (error) {
            throw new BadRequestError('Erro ao atualizar diarista');
        }
    }

    async deleteDiarista(req, res) {
        try {
            const { id } = req.params;
            const service = new DeleteDiaristaService();
            const diarista = await service.execute(id);
            return res.status(200).json(diarista);
        } catch (error) {
            throw new BadRequestError('Erro ao excluir diarista');
        }
    }
}
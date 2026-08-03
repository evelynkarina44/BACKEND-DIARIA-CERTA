import { CreateDisponibilidadeDiaristaService } from '../services/disponibilidadeDiarista/CreateDisponibilidadeDiaristaService';
import { FindDisponibilidadeDiaristaService } from '../services/disponibilidadeDiarista/FindDisponibilidadeDiaristaService';
import { ListDisponibilidadeDiaristaService } from '../services/disponibilidadeDiarista/ListDisponibilidadeDiaristaService';
import { UpdateDisponibilidadeDiaristaService } from '../services/disponibilidadeDiarista/UpdateDisponibilidadeDiaristaService';
import { DeleteDisponibilidadeDiaristaService } from '../services/disponibilidadeDiarista/DeleteDisponibilidadeDiaristaService';

import { NotFoundError } from "../errors/NotFoundError";
import { BadRequestError } from '../errors/BadRequestError';

export class DisponibilidadeDiaristaController {

    async listarDisponibilidades(req, res) {
        try {
            const service = new ListDisponibilidadeDiaristaService();
            const disponibilidades = await service.execute();
            return res.status(200).json(disponibilidades);
        } catch (error) {
            throw new BadRequestError('Erro ao listar disponibilidades');
        }
    }

     async buscarDisponibilidadePorId(req, res) {
        try {
            const { id } = req.params;
            const service = new FindDisponibilidadeDiaristaService();
            const disponibilidade = await service.execute(id);
            if (!disponibilidade) {
                throw new NotFoundError('Disponibilidade não encontrada');
            }
            return res.status(200).json(disponibilidade);
        } catch (error) {
            throw new BadRequestError('Erro ao buscar disponibilidade');
        }
    }

    async criarDisponibilidade(req, res) {
        try {
            const service = new CreateDisponibilidadeDiaristaService();
            const disponibilidade = await service.execute(req.body);
            return res.status(201).json(disponibilidade);
        } catch (error) {
            throw new BadRequestError('Erro ao criar disponibilidade');
        }
    }

    async atualizarDisponibilidade(req, res) {
        try {
            const { id } = req.params;
            const service = new UpdateDisponibilidadeDiaristaService();
            const disponibilidade = await service.execute(id, req.body);
            return res.status(200).json(disponibilidade);
        } catch (error) {
            throw new BadRequestError('Erro ao atualizar disponibilidade');
        }
    }

    async deletarDisponibilidade(req, res) {
        try {
            const { id } = req.params;
            const service = new DeleteDisponibilidadeDiaristaService();
            const disponibilidade = await service.execute(id);
            return res.status(200).json(disponibilidade);
        } catch (error) {
            throw new BadRequestError('Erro ao excluir disponibilidade');
        }
    }
}
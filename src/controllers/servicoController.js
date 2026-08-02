import { CreateServicoService } from '../services/servico/CreateServicoService';
import { FindServicoService } from '../services/servico/FindServicoService';
import { ListServicoService } from '../services/servico/ListServicoService';
import { UpdateServicoService } from '../services/servico/UpdateServicoService';
import { DeleteServicoService } from '../services/servico/DeleteServicoService';

import { NotFoundError } from "../errors/NotFoundError";
import { BadRequestError } from '../errors/BadRequestError';

export class ServicoController {

    async listarServicos(req, res) {
        try {
            const service = new ListServicoService();
            const servicos = await service.execute();
            return res.status(200).json(servicos);
        } catch (error) {
            throw new BadRequestError('Erro ao listar servicos');
        }
    }

     async buscarServicoPorId(req, res) {
        try {
            const { id } = req.params;
            const service = new FindServicoService();
            const servico = await service.execute(id);
            if (!servico) {
                throw new NotFoundError('Servico não encontrado');
            }
            return res.status(200).json(servico);
        } catch (error) {
            throw new BadRequestError('Erro ao buscar servico');
        }
    }

    async criarServico(req, res) {
        try {
            const service = new CreateServicoService();
            const servico = await service.execute(req.body);
            return res.status(201).json(servico);
        } catch (error) {
            throw new BadRequestError('Erro ao criar servico');
        }
    }

    async atualizarServico(req, res) {
        try {
            const { id } = req.params;
            const service = new UpdateServicoService();
            const servico = await service.execute(id, req.body);
            return res.status(200).json(servico);
        } catch (error) {
            throw new BadRequestError('Erro ao atualizar servico');
        }
    }

    async deletarServico(req, res) {
        try {
            const { id } = req.params;
            const service = new DeleteServicoService();
            const servico = await service.execute(id);
            return res.status(200).json(servico);
        } catch (error) {
            throw new BadRequestError('Erro ao excluir servico');
        }
    }
}
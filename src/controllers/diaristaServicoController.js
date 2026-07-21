import { CreateDiaristaServicoService } from '../services/diaristaServico/CreateDiaristaServicoService';
import { FindDiaristaServicoService } from '../services/diaristaServico/FindDiaristaServicoService';
import { ListDiaristaServicosService } from '../services/diaristaServico/ListDiaristaServicoService';
import { UpdateDiaristaServicoService } from '../services/diaristaServico/UpdateDiaristaServicoService';
import { DeleteDiaristaServicoService } from '../services/diaristaServico/DeleteDiaristaServicoService';

import { NotFoundError } from "../errors/NotFoundError";
import { BadRequestError } from '../errors/BadRequestError';

export class DiaristaServicoController {

    async listarDiaristaServicos(req, res) {
        try {
            const service = new ListDiaristaServicosService();
            const diaristaServicos = await service.execute();
            return res.status(200).json(diaristaServicos);
        } catch (error) {
            throw new BadRequestError('Erro ao listar diarista_servicos');
        }
    }

     async buscarDiaristaServicoPorId(req, res) {
        try {
            const { id } = req.params;
            const service = new FindDiaristaServicoService();
            const diaristaServico = await service.execute(id);
            if (!diaristaServico) {
                throw new NotFoundError('Diarista-Serviço não encontrado');
            }
            return res.status(200).json(diaristaServico);
        } catch (error) {
            throw new BadRequestError('Erro ao buscar diarista-serviço');
        }
    }

    async criarDiaristaServico(req, res) {
        try {
            const service = new CreateDiaristaServicoService();
            const diaristaServico = await service.execute(req.body);
            return res.status(201).json(diaristaServico);
        } catch (error) {
            throw new BadRequestError('Erro ao criar diarista-serviço');
        }
    }

    async atualizarDiaristaServico(req, res) {
        try {
            const { id } = req.params;
            const service = new UpdateDiaristaServicoService();
            const diaristaServico = await service.execute(id, req.body);
            return res.status(200).json(diaristaServico);
        } catch (error) {
            throw new BadRequestError('Erro ao atualizar diarista-serviço');
        }
    }

    async deletarDiaristaServico(req, res) {
        try {
            const { id } = req.params;
            const service = new DeleteDiaristaServicoService();
            const diaristaServico = await service.execute(id);
            return res.status(200).json(diaristaServico);
        } catch (error) {
            throw new BadRequestError('Erro ao excluir diarista-serviço');
        }
    }
}
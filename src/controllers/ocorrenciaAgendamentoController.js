import { CreateOcorrenciaAgendamentoService } from '../services/ocorrenciaAgendamento/CreateOcorrenciaAgendamentoService';
import { FindOcorrenciaAgendamentoService } from '../services/ocorrenciaAgendamento/FindOcorrenciaAgendamentoService';
import { ListOcorrenciaAgendamentoService } from '../services/ocorrenciaAgendamento/ListOcorrenciaAgendamentoService';
import { UpdateOcorrenciaAgendamentoService } from '../services/ocorrenciaAgendamento/UpdateOcorrenciaAgendamentoService';
import { DeleteOcorrenciaAgendamentoService } from '../services/ocorrenciaAgendamento/DeleteFavoritoService';

import { NotFoundError } from "../errors/NotFoundError";
import { BadRequestError } from '../errors/BadRequestError';

export class OcorrenciaAgendamentoController {

    async listarOcorrencias(req, res) {
        try {
            const service = new ListOcorrenciaAgendamentoService();
            const ocorrencias = await service.execute();
            return res.status(200).json(ocorrencias);
        } catch (error) {
            throw new BadRequestError('Erro ao listar ocorrências');
        }
    }

     async buscarOcorrenciaPorId(req, res) {
        try {
            const { id } = req.params;
            const service = new FindOcorrenciaAgendamentoService();
            const ocorrencia = await service.execute(id);
            if (!ocorrencia) {
                throw new NotFoundError('Ocorrência não encontrada');
            }
            return res.status(200).json(ocorrencia);
        } catch (error) {
            throw new BadRequestError('Erro ao buscar ocorrência');
        }
    }

    async criarOcorrencia(req, res) {
        try {
            const service = new CreateOcorrenciaAgendamentoService();
            const ocorrencia = await service.execute(req.body);
            return res.status(201).json(ocorrencia);
        } catch (error) {
            throw new BadRequestError('Erro ao criar ocorrência');
        }
    }

    async atualizarOcorrencia(req, res) {
        try {
            const { id } = req.params;
            const service = new UpdateOcorrenciaAgendamentoService();
            const ocorrencia = await service.execute(id, req.body);
            return res.status(200).json(ocorrencia);
        } catch (error) {
            throw new BadRequestError('Erro ao atualizar ocorrência');
        }
    }
    async deletarOcorrencia(req, res) {
        try {
            const { id } = req.params;
            const service = new DeleteOcorrenciaAgendamentoService();
            const ocorrencia = await service.execute(id);
            return res.status(200).json(ocorrencia);
        } catch (error) {
            throw new BadRequestError('Erro ao excluir ocorrência');
        }
    }
}
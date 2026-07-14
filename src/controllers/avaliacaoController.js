import { CreateAvaliacaoService } from '../services/avaliacao/CreateAvaliacaoService';
import { FindAvaliacaoService } from '../services/avaliacao/FindAvaliacaoService';
import { ListAvaliacaoService } from '../services/avaliacao/ListAvaliacaoService';
import { UpdateAvaliacaoService } from '../services/avaliacao/UpdateAvaliacaoService';
import { DeleteAvaliacaoService } from '../services/avaliacao/DeleteAvaliacaoService';

import { NotFoundError } from "../errors/NotFoundError";
import { BadRequestError } from '../errors/BadRequestError';

export class AvaliacaoController {

    async listarAvaliacao(req, res) {
        try {
            const service = new ListAvaliacaoService();
            const Avaliacao = await service.execute();
            return res.status(200).json(Avaliacao);
        } catch (error) {
            throw new BadRequestError('Erro ao listar avaliacaos');
        }
    }

    async buscarAvaliacaoPorId(req, res) {
        try {
            const { id } = req.params;
            const service = new FindAvaliacaoService();
            const Avaliacao = await service.execute(id);
            if (!Avaliacao) {
                throw new NotFoundError('Avaliacao não encontrado');
            }
            return res.status(200).json(Avaliacao);
        } catch (error) {
            throw new BadRequestError('Erro ao buscar avaliacao');
        }
    }

    async criarAvaliacao(req, res) {
        try {
            const service = new CreateAvaliacaoService();
            const Avaliacao = await service.execute(req.body);
            return res.status(201).json(Avaliacao);
        } catch (error) {
            throw new BadRequestError('Erro ao criar avaliacao');
        }
    }

    async atualizarAvaliacao(req, res) {
        try {
            const { id } = req.params;
            const service = new UpdateAvaliacaoService();
            const Avaliacao = await service.execute(id, req.body);
            return res.status(200).json(Avaliacao);
        } catch (error) {
            throw new BadRequestError('Erro ao atualizar avaliacao');
        }
    }

    async deletarAvaliacao(req, res) {
        try {
            const { id } = req.params;
            const service = new DeleteAvaliacaoService();
            const Avaliacao = await service.execute(id);
            return res.status(200).json(Avaliacao);
        } catch (error) {
            throw new BadRequestError('Erro ao excluir avaliacao');
        }
    }
}

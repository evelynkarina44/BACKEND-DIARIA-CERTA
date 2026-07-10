import { CreateAgendamentoService } from '../services/agendamento/CreateAgendamentoService';
import { FindAgendamentoService } from '../services/agendamento/FindAgendamentoService';
import { ListAgendamentoService } from '../services/agendamento/ListAgendamentoService';
import { UpdateAgendamentoService } from '../services/agendamento/UpdateAgendamentoService';
import { DeleteAgendamentoService } from '../services/agendamento/DeleteAgendamentoService';

import { NotFoundError } from "../errors/NotFoundError";
import { BadRequestError } from '../errors/BadRequestError';

export class AgendamentoController {

    async listarAgendamento(req, res) {
        try {
            const service = new ListAgendamentoService();
            const Agendamento = await service.execute();
            return res.status(200).json(Agendamento);
        } catch (error) {
            throw new BadRequestError('Erro ao listar agendamentos');
        }
    }

    async buscarAgendamentoPorId(req, res) {
        try {
            const { id } = req.params;
            const service = new FindAgendamentoService();
            const Agendamento = await service.execute(id);
            if (!Agendamento) {
                throw new NotFoundError('Agendamento não encontrado');
            }
            return res.status(200).json(Agendamento);
        } catch (error) {
            throw new BadRequestError('Erro ao buscar agendamento');
        }
    }

    async criarAgendamento(req, res) {
        try {
            const service = new CreateAgendamentoService();
            const Agendamento = await service.execute(req.body);
            return res.status(201).json(Agendamento);
        } catch (error) {
            throw new BadRequestError('Erro ao criar agendamento');
        }
    }

    async atualizarAgendamento(req, res) {
        try {
            const { id } = req.params;
            const service = new UpdateAgendamentoService();
            const Agendamento = await service.execute(id, req.body);
            return res.status(200).json(Agendamento);
        } catch (error) {
            throw new BadRequestError('Erro ao atualizar agendamento');
        }
    }

    async deletarAgendamento(req, res) {
        try {
            const { id } = req.params;
            const service = new DeleteAgendamentoService();
            const Agendamento = await service.execute(id);
            return res.status(200).json(Agendamento);
        } catch (error) {
            throw new BadRequestError('Erro ao excluir agendamento');
        }
    }
}

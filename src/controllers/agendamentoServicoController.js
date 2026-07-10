import { CreateAgendamentoServicoService } from '../services/agendamentoServico/CreateAgendamentoServicoService';
import { FindAgendamentoServicoService } from '../services/agendamentoServico/FindAgendamentoServicoService';
import { ListAgendamentoServicoService } from '../services/agendamentoServico/ListAgendamentoServicoService';
import { UpdateAgendamentoServicoService } from '../services/agendamentoServico/UpdateAgendamentoServicoService';
import { DeleteAgendamentoServicoService } from '../services/agendamentoServico/DeleteAgendamentoServicoService';

import { NotFoundError } from "../errors/NotFoundError";
import { BadRequestError } from '../errors/BadRequestError';

export class AgendamentoServicoController {

    async listarAgendamentoServico(req, res) {
        try {
            const service = new ListAgendamentoServicoService();
            const AgendamentoServico = await service.execute();
            return res.status(200).json(AgendamentoServico);
        } catch (error) {
            throw new BadRequestError('Erro ao listar agendamentos serviços');
        }
    }

    async buscarAgendamentoServicoPorId(req, res) {
        try {
            const { id } = req.params;
            const service = new FindAgendamentoServicoService();
            const AgendamentoServico = await service.execute(id);
            if (!AgendamentoServico) {
                throw new NotFoundError('Agendamento de serviço não encontrado');
            }
            return res.status(200).json(AgendamentoServico);
        } catch (error) {
            throw new BadRequestError('Erro ao buscar agendamento de serviço');
        }
    }

    async criarAgendamentoServico(req, res) {
        try {
            const service = new CreateAgendamentoServicoService();
            const AgendamentoServico = await service.execute(req.body);
            return res.status(201).json(AgendamentoServico);
        } catch (error) {
            throw new BadRequestError('Erro ao criar agendamento de serviço');
        }
    }

    async atualizarAgendamentoServico(req, res) {
        try {
            const { id } = req.params;
            const service = new UpdateAgendamentoServicoService();
            const AgendamentoServico = await service.execute(id, req.body);
            return res.status(200).json(AgendamentoServico);
        } catch (error) {
            throw new BadRequestError('Erro ao atualizar agendamento de serviço');
        }
    }

    async deletarAgendamentoServico(req, res) {
        try {
            const { id } = req.params;
            const service = new DeleteAgendamentoServicoService();
            const AgendamentoServico = await service.execute(id);
            return res.status(200).json(AgendamentoServico);
        } catch (error) {
            throw new BadRequestError('Erro ao excluir agendamento de serviço');
        }
    }
}

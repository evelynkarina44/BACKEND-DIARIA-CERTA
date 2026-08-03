import { CreateComboServicoService } from '../services/comboServico/CreateComboServicoService';
import { FindComboServicoService } from '../services/comboServico/FindComboServicoService';
import { ListComboServicosService } from '../services/comboServico/ListComboServicosService';
import { UpdateComboServicoService } from '../services/comboServico/UpdateComboServicoService';
import { DeleteComboServicoService } from '../services/comboServico/DeleteComboServicoService';

import { NotFoundError } from "../errors/NotFoundError";
import { BadRequestError } from '../errors/BadRequestError';

export class ComboServicoController {

    async listarComboServicos(req, res) {
        try {
            const service = new ListComboServicosService();
            const comboServicos = await service.execute();
            return res.status(200).json(comboServicos);
        } catch (error) {
            throw new BadRequestError('Erro ao listar combo servicos');
        }
    }

    async buscarComboServicoPorId(req, res) {
        try {
            const { id } = req.params;
            const service = new FindComboServicoService();
            const comboServico = await service.execute(id);
            if (!comboServico) {
                throw new NotFoundError('ComboServico não encontrado');
            }
            return res.status(200).json(comboServico);
        } catch (error) {
            throw new BadRequestError('Erro ao buscar combo servico');
        }
    }

    async criarComboServico(req, res) {
        try {
            const service = new CreateComboServicoService();
            const comboServico = await service.execute(req.body);
            return res.status(201).json(comboServico);
        } catch (error) {
            throw new BadRequestError('Erro ao criar combo servico');
        }
    }

    async atualizarComboServico(req, res) {
        try {
            const { id } = req.params;
            const service = new UpdateComboServicoService();
            const comboServico = await service.execute(id, req.body);
            return res.status(200).json(comboServico);
        } catch (error) {
            throw new BadRequestError('Erro ao atualizar combo servico');
        }
    }

    async deletarComboServico(req, res) {
        try {
            const { id } = req.params;
            const service = new DeleteComboServicoService();
            const comboServico = await service.execute(id);
            return res.status(200).json(comboServico);
        } catch (error) {
            throw new BadRequestError('Erro ao excluir combo servico');
        }
    }
}

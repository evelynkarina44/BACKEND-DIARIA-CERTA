import { CreateComboBaseService } from '../services/comboBase/CreateComboBaseService';
import { FindComboBaseService } from '../services/comboBase/FindComboBaseService';
import { ListComboBasesService } from '../services/comboBase/ListComboBasesService';
import { UpdateComboBaseService } from '../services/comboBase/UpdateComboBaseService';
import { DeleteComboBaseService } from '../services/comboBase/DeleteComboBaseService';

import { NotFoundError } from "../errors/NotFoundError";
import { BadRequestError } from '../errors/BadRequestError';

export class ComboBaseController {

    async listarComboBases(req, res) {
        try {
            const service = new ListComboBasesService();
            const comboBases = await service.execute();
            return res.status(200).json(comboBases);
        } catch (error) {
            throw new BadRequestError('Erro ao listar combo bases');
        }
    }

    async buscarComboBasePorId(req, res) {
        try {
            const { id } = req.params;
            const service = new FindComboBaseService();
            const comboBase = await service.execute(id);
            if (!comboBase) {
                throw new NotFoundError('ComboBase não encontrado');
            }
            return res.status(200).json(comboBase);
        } catch (error) {
            throw new BadRequestError('Erro ao buscar combo base');
        }
    }

    async criarComboBase(req, res) {
        try {
            const service = new CreateComboBaseService();
            const comboBase = await service.execute(req.body);
            return res.status(201).json(comboBase);
        } catch (error) {
            throw new BadRequestError('Erro ao criar combo base');
        }
    }

    async atualizarComboBase(req, res) {
        try {
            const { id } = req.params;
            const service = new UpdateComboBaseService();
            const comboBase = await service.execute(id, req.body);
            return res.status(200).json(comboBase);
        } catch (error) {
            throw new BadRequestError('Erro ao atualizar combo base');
        }
    }

    async deletarComboBase(req, res) {
        try {
            const { id } = req.params;
            const service = new DeleteComboBaseService();
            const comboBase = await service.execute(id);
            return res.status(200).json(comboBase);
        } catch (error) {
            throw new BadRequestError('Erro ao excluir combo base');
        }
    }
}

import { CreateCheckinCheckoutService } from '../services/checkinCheckout/CreateCheckinCheckoutService';
import { FindCheckinCheckoutService } from '../services/checkinCheckout/FindCheckinCheckoutService';
import { ListCheckinCheckoutService } from '../services/checkinCheckout/ListCheckinCheckoutService';
import { UpdateCheckinCheckoutService } from '../services/checkinCheckout/UpdateCheckinCheckoutService';
import { DeleteCheckinCheckoutService } from '../services/checkinCheckout/DeleteCheckinCheckoutService';

import { NotFoundError } from "../errors/NotFoundError";
import { BadRequestError } from '../errors/BadRequestError';

export class CheckinCheckoutController {

    async listarCheckinCheckout(req, res) {
        try {
            const service = new ListCheckinCheckoutService();
            const CheckinCheckout = await service.execute();
            return res.status(200).json(CheckinCheckout);
        } catch (error) {
            throw new BadRequestError('Erro ao listar checkinCheckouts');
        }
    }

    async buscarCheckinCheckoutPorId(req, res) {
        try {
            const { id } = req.params;
            const service = new FindCheckinCheckoutService();
            const CheckinCheckout = await service.execute(id);
            if (!CheckinCheckout) {
                throw new NotFoundError('CheckinCheckout não encontrado');
            }
            return res.status(200).json(CheckinCheckout);
        } catch (error) {
            throw new BadRequestError('Erro ao buscar checkinCheckout');
        }
    }

    async criarCheckinCheckout(req, res) {
        try {
            const service = new CreateCheckinCheckoutService();
            const CheckinCheckout = await service.execute(req.body);
            return res.status(201).json(CheckinCheckout);
        } catch (error) {
            throw new BadRequestError('Erro ao criar checkinCheckout');
        }
    }

    async atualizarCheckinCheckout(req, res) {
        try {
            const { id } = req.params;
            const service = new UpdateCheckinCheckoutService();
            const CheckinCheckout = await service.execute(id, req.body);
            return res.status(200).json(CheckinCheckout);
        } catch (error) {
            throw new BadRequestError('Erro ao atualizar checkinCheckout');
        }
    }

    async deletarCheckinCheckout(req, res) {
        try {
            const { id } = req.params;
            const service = new DeleteCheckinCheckoutService();
            const CheckinCheckout = await service.execute(id);
            return res.status(200).json(CheckinCheckout);
        } catch (error) {
            throw new BadRequestError('Erro ao excluir checkinCheckout');
        }
    }
}

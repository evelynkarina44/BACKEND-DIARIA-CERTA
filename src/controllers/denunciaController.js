import { CreateDenunciaService } from '../services/denuncia/CreateDenunciaService';
import { FindDenunciaService } from '../services/denuncia/FindDenunciaService';
import { ListDenunciasService } from '../services/denuncia/ListDenunciaService';
import { UpdateDenunciaService } from '../services/denuncia/UpdateDenunciaService';
import { DeleteDenunciaService } from '../services/denuncia/DeleteDenunciaService';

import { NotFoundError } from "../errors/NotFoundError";
import { BadRequestError } from '../errors/BadRequestError';

export class DenunciaController {

    async listarDenuncias(req, res) {
        try {
            const service = new ListDenunciasService();
            const denuncias = await service.execute();
            return res.status(200).json(denuncias);
        } catch (error) {
            throw new BadRequestError('Erro ao listar denuncias');
        }
    }

     async buscarDenunciaPorId(req, res) {
        try {
            const { id } = req.params;
            const service = new FindDenunciaService();
            const denuncia = await service.execute(id);
            if (!denuncia) {
                throw new NotFoundError('Denúncia não encontrada');
            }
            return res.status(200).json(denuncia);
        } catch (error) {
            throw new BadRequestError('Erro ao buscar denúncia');
        }
    }

    async criarDenuncia(req, res) {
        try {
            const service = new CreateDenunciaService();
            const denuncia = await service.execute(req.body);
            return res.status(201).json(denuncia);
        } catch (error) {
            throw new BadRequestError('Erro ao criar denúncia');
        }
    }

    async atualizarDenuncia(req, res) {
        try {
            const { id } = req.params;
            const service = new UpdateDenunciaService();
            const denuncia = await service.execute(id, req.body);
            return res.status(200).json(denuncia);
        } catch (error) {
            throw new BadRequestError('Erro ao atualizar denúncia');
        }
    }

    async deletarDenuncia(req, res) {
        try {
            const { id } = req.params;
            const service = new DeleteDenunciaService();
            const denuncia = await service.execute(id);
            return res.status(200).json(denuncia);
        } catch (error) {
            throw new BadRequestError('Erro ao excluir denúncia');
        }
    }
}
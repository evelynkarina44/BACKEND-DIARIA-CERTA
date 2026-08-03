import { CreateFavoritoService } from '../services/favorito/CreateFavoritoService';
import { FindFavoritoService } from '../services/favorito/FindFavoritoService';
import { ListFavoritoService } from '../services/favorito/ListFavoritoService';
import { UpdateFavoritoService } from '../services/favorito/UpdateFavoritoService';
import { DeleteFavoritoService } from '../services/favorito/DeleteFavoritoService';

import { NotFoundError } from "../errors/NotFoundError";
import { BadRequestError } from '../errors/BadRequestError';

export class FavoritoController {

    async listarFavoritos(req, res) {
        try {
            const service = new ListFavoritoService();
            const favoritos = await service.execute();
            return res.status(200).json(favoritos);
        } catch (error) {
            throw new BadRequestError('Erro ao listar favoritos');
        }
    }

     async buscarFavoritoPorId(req, res) {
        try {
            const { id } = req.params;
            const service = new FindFavoritoService();
            const favorito = await service.execute(id);
            if (!favorito) {
                throw new NotFoundError('Favorito não encontrado');
            }
            return res.status(200).json(favorito);
        } catch (error) {
            throw new BadRequestError('Erro ao buscar favorito');
        }
    }

    async criarFavorito(req, res) {
        try {
            const service = new CreateFavoritoService();
            const favorito = await service.execute(req.body);
            return res.status(201).json(favorito);
        } catch (error) {
            throw new BadRequestError('Erro ao criar favorito');
        }
    }

    async atualizarFavorito(req, res) {
        try {
            const { id } = req.params;
            const service = new UpdateFavoritoService();
            const favorito = await service.execute(id, req.body);
            return res.status(200).json(favorito);
        } catch (error) {
            throw new BadRequestError('Erro ao atualizar favorito');
        }
    }

    async deletarFavorito(req, res) {
        try {
            const { id } = req.params;
            const service = new DeleteFavoritoService();
            const favorito = await service.execute(id);
            return res.status(200).json(favorito);
        } catch (error) {
            throw new BadRequestError('Erro ao excluir favorito');
        }
    }
}
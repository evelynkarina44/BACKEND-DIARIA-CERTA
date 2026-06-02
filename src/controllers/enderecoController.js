import { CreateEnderecoService } from '../services/endereco/CreateEnderecoService';
import { FindEnderecoService } from '../services/endereco/FindEnderecoService';
import { ListEnderecosService } from '../services/endereco/ListEnderecosService';
import { UpdateEnderecoService } from '../services/endereco/UpdateEnderecoService';
import { DeleteEnderecoService } from '../services/endereco/DeleteEnderecoService';

import { NotFoundError } from "../errors/NotFoundError";
import { BadRequestError } from '../errors/BadRequestError';

export class EnderecoController {

    async listarEnderecos(req, res) {
        try {
            const service = new ListEnderecosService();
            const enderecos = await service.execute();
            return res.status(200).json(enderecos);
        } catch (error) {
            throw new BadRequestError('Erro ao listar endereços');
        }
    }

     async buscarEnderecoPorId(req, res) {
        try {
            const { id } = req.params;
            const service = new FindEnderecoService();
            const endereco = await service.execute(id);
            if (!endereco) {
                throw new NotFoundError('Endereço não encontrado');
            }
            return res.status(200).json(endereco);
        } catch (error) {
            throw new BadRequestError('Erro ao buscar endereço');
        }
    }

    async createEndereco(req, res) {
        try {
            const service = new CreateEnderecoService();
            const endereco = await service.execute(req.validatedData);
            return res.status(201).json(endereco);
        } catch (error) {
            throw new BadRequestError('Erro ao criar endereço');
        }
    }

    async updateEndereco(req, res) {
        try {
            const { id } = req.params;
            const service = new UpdateEnderecoService();
            const endereco = await service.execute(id, req.validatedData);
            return res.status(200).json(endereco);
        } catch (error) {
            throw new BadRequestError('Erro ao atualizar endereço');
        }
    }

    async deleteEndereco(req, res) {
        try {
            const { id } = req.params;
            const service = new DeleteEnderecoService();
            const endereco = await service.execute(id);
            return res.status(200).json(endereco);
        } catch (error) {
            throw new BadRequestError('Erro ao excluir endereço');
        }
    }
}
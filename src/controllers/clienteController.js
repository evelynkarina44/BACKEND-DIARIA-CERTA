import { CreateClienteService } from '../services/cliente/CreateClienteService';
import { FindClienteService } from '../services/cliente/FindClienteService';
import { ListClientesService } from '../services/cliente/ListClientesService';
import { UpdateClienteService } from '../services/cliente/UpdateClienteService';
import { DeleteClienteService } from '../services/cliente/DeleteClienteService';

import { NotFoundError } from "../errors/NotFoundError";
import { BadRequestError } from '../errors/BadRequestError';

export class ClienteController {

    async listarClientes(req, res) {
        try {
            const service = new ListClientesService();
            const clients = await service.execute();
            return res.status(200).json(clients);
        } catch (error) {
            throw new BadRequestError('Erro ao listar clientes');
        }
    }

    async buscarClientePorId(req, res) {
        try {
            const { id_cliente } = req.params;
            const service = new FindClienteService();
            const client = await service.execute(id_cliente);
            if (!client) {
                throw new NotFoundError('Cliente não encontrado');
            }
            return res.status(200).json(client);
        } catch (error) {
            throw new BadRequestError('Erro ao buscar cliente');
        }
    }

    async criarCliente(req, res) {
        try {
            const service = new CreateClienteService();
            const client = await service.execute(req.validatedData);
            return res.status(201).json(client);
        } catch (error) {
            throw new BadRequestError('Erro ao criar cliente');
        }
    }

    async atualizarCliente(req, res) {
        try {
            const { id_cliente } = req.params;
            const service = new UpdateClienteService();
            const client = await service.execute(id_cliente, req.validatedData);
            return res.status(200).json(client);
        } catch (error) {
            throw new BadRequestError('Erro ao atualizar cliente');
        }
    }

    async deletarCliente(req, res) {
        try {
            const { id_cliente } = req.params;
            const service = new DeleteClienteService();
            const client = await service.execute(id_cliente);
            return res.status(200).json(client);
        } catch (error) {
            throw new BadRequestError('Erro ao excluir cliente');
        }
    }
}

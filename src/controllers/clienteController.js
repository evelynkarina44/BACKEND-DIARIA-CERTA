const clienteService = require('../services/clienteService');

class ClienteController {

    async listarClientes(req, res) {
        const clientes = await clienteService.listarClientes();
        res.json(clientes);
    }

    async buscarClientePorId(req, res) {
        const { id } = req.params;

        if(id == undefined || id == null) {
            return res.status(400).json({ error: 'Id incorreto' });
        }

        const cliente = await clienteService.buscarClientePorId(id);

        if (!cliente) {
            return res.status(404).json({
                 erro: 'Cliente não encontrado' });
        }

        return res.json(cliente);
    }

    async criarCliente(req, res) {
        const { dados } = req.body || {};

        if(dados == undefined || dados == null) {
            return res.status(400).json({ error: 'Dados incorretos' });
        }
        
        const cliente = await clienteService.criarCliente(dados);

        if (!cliente) {
            return res.status(404).json({
                 error: 'Erro ao criar cliente' });
        }

        return res.status(201).json(cliente);
    }

    async atualizarCliente(req, res) {
        const { id } = req.params;
        const { dados } = req.body || {};

        if(id == undefined || id == null) {
            return res.status(400).json({ error: 'Id incorreto' });
        }

        if(dados == undefined || dados == null) {
            return res.status(400).json({ error: 'Dados incorretos' });
        }

        const cliente = await clienteService.atualizarCliente(id, dados);

        if (!cliente) {
            return res.status(404).json({ error: 'Cliente não encontrado' });
        }

        return res.status(201).json(cliente);
    }

    async deletarCliente(req, res) {
        const { id } = req.params;

        if(id == undefined || id == null) {
            return res.status(400).json({ error: 'Id incorreto' });
        }

        const cliente = await clienteService.deletarCliente(id);

        if (!cliente) {
            return res.status(404).json({ error: 'Erro ao deletar cliente' });
        }

        return res.status(204).send();
    }
}

module.exports = new ClienteController();
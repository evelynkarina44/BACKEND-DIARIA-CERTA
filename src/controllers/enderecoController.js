const enderecoService = require('../services/enderecoService');

class EnderecoController {

    async listarEnderecos(req, res) {
        const enderecos = await enderecoService.listarEnderecos();
        res.json(enderecos);
    }

    async buscarEnderecoPorId(req, res) {
        const { id } = req.params;

        if(id == undefined || id == null) {
            return res.status(400).json({ error: 'Id incorreto' });
        }

        const endereco = await enderecoService.buscarEnderecoPorId(id);

        if (!endereco) {
            return res.status(404).json({
                 erro: 'Endereço não encontrado' });
        }

        return res.json(endereco);
    }

    async criarEndereco(req, res) {
        const { dados } = req.body || {};

        if(dados == undefined || dados == null) {
            return res.status(400).json({ error: 'Dados incorretos' });
        }
        
        const endereco = await enderecoService.criarEndereco(dados);

        if (!endereco) {
            return res.status(404).json({
                 error: 'Erro ao criar endereço' });
        }

        return res.status(201).json(endereco);
    }

    async atualizarEndereco(req, res) {
        const { id } = req.params;
        const { dados } = req.body || {};

        if(id == undefined || id == null) {
            return res.status(400).json({ error: 'Id incorreto' });
        }

        if(dados == undefined || dados == null) {
            return res.status(400).json({ error: 'Dados incorretos' });
        }

        const endereco = await enderecoService.atualizarEndereco(id, dados);

        if (!endereco) {
            return res.status(404).json({ error: 'Endereço não encontrado' });
        }

        return res.status(201).json(endereco);
    }

    async deletarEndereco(req, res) {
        const { id } = req.params;

        if(id == undefined || id == null) {
            return res.status(400).json({ error: 'Id incorreto' });
        }

        const endereco = await enderecoService.deletarEndereco(id);

        if (!endereco) {
            return res.status(404).json({ error: 'Erro ao deletar endereço' });
        }

        return res.status(204).send();
    }
}

module.exports = new EnderecoController();
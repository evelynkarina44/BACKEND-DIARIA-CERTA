const diaristaService = require('../services/diaristaService');

class DiaristaController {

    async listarDiaristas(req, res) {
        const diaristas = await diaristaService.listarDiaristas();
        res.json(diaristas);
    }

    async buscarDiaristaPorId(req, res) {
        const { id } = req.params;

        if(id == undefined || id == null) {
            return res.status(400).json({ error: 'Id incorreto' });
        }

        const diarista = await diaristaService.buscarDiaristaPorId(id);

        if (!diarista) {
            return res.status(404).json({
                 erro: 'Diarista não encontrada' });
        }

        return res.json(diarista);
    }

    async criarDiarista(req, res) {
        const { dados } = req.body;

        if(dados == undefined || dados == null) {
            return res.status(400).json({ error: 'Dados incorretos' });
        }
        
        const diarista = await diaristaService.criarDiarista(dados);

        if (!diarista) {
            return res.status(404).json({
                 error: 'Erro ao criar diarista' });
        }

        return res.status(201).json(diarista);
    }

    async atualizarDiarista(req, res) {
        const { id } = req.params;
        const { dados } = req.body;

        if(id == undefined || id == null) {
            return res.status(400).json({ error: 'Id incorreto' });
        }

        if(dados == undefined || dados == null) {
            return res.status(400).json({ error: 'Dados incorretos' });
        }

        const diarista = await diaristaService.atualizarDiarista(id, dados);

        if (!diarista) {
            return res.status(404).json({ error: 'Diarista não encontrada' });
        }

        return res.status(201).json(diarista);
    }

    async deletarDiarista(req, res) {
        const { id } = req.params;

        if(id == undefined || id == null) {
            return res.status(400).json({ error: 'Id incorreto' });
        }

        const diarista = await diaristaService.deletarDiarista(id);

        if (!diarista) {
            return res.status(404).json({ error: 'Erro ao deletar diarista' });
        }

        return res.status(204).send();
    }
}

module.exports = new DiaristaController();
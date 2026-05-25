const comboBaseService = require('../services/comboBaseService');

class ComboBaseController {

    async listarComboBases(req, res) {
        const comboBases = await comboBaseService.listarComboBases();
        res.json(comboBases);
    }

    async buscarComboBasePorId(req, res) {
        const { id } = req.params;

        if(id == undefined || id == null) {
            return res.status(400).json({ error: 'Id incorreto' });
        }

        const comboBase = await comboBaseService.buscarComboBasePorId(id);

        if (!comboBase) {
            return res.status(404).json({
                 erro: 'Combo base não encontrado' });
        }

        return res.json(comboBase);
    }

    async criarComboBase(req, res) {
        const { dados } = req.body || {};

        if(dados == undefined || dados == null) {
            return res.status(400).json({ error: 'Dados incorretos' });
        }
        
        const comboBase = await comboBaseService.criarComboBase(dados);

        if (!comboBase) {
            return res.status(404).json({
                 error: 'Erro ao criar combo base' });
        }

        return res.status(201).json(comboBase);
    }

    async atualizarComboBase(req, res) {
        const { id } = req.params;
        const { dados } = req.body || {};

        if(id == undefined || id == null) {
            return res.status(400).json({ error: 'Id incorreto' });
        }

        if(dados == undefined || dados == null) {
            return res.status(400).json({ error: 'Dados incorretos' });
        }

        const comboBase = await comboBaseService.atualizarComboBase(id, dados);

        if (!comboBase) {
            return res.status(404).json({ error: 'Combo base não encontrado' });
        }

        return res.status(201).json(comboBase);
    }

    async deletarComboBase(req, res) {
        const { id } = req.params;

        if(id == undefined || id == null) {
            return res.status(400).json({ error: 'Id incorreto' });
        }

        const comboBase = await comboBaseService.deletarComboBase(id);

        if (!comboBase) {
            return res.status(404).json({ error: 'Erro ao deletar combo base' });
        }

        return res.status(204).send();
    }
}

module.exports = new ComboBaseController();

const usuarioService = require('../services/usuarioService');

class UsuarioController {

    async listarUsuarios(req, res) {
        const usuarios = await usuarioService.listarUsuarios();
        res.json(usuarios);
    }

    async buscarUsuarioPorId(req, res) {
        const { id } = req.params;

        if(id == undefined || id == null) {
            return res.status(400).json({ error: 'Id incorreto' });
        }

        const usuario = await usuarioService.buscarUsuarioPorId(id);

        if (!usuario) {
            return res.status(404).json({
                 erro: 'Usuário não encontrado' });
        }

        return res.json(usuario);
    }

    async criarUsuario(req, res) {
        const { dados } = req.body || {};

        if(dados == undefined || dados == null) {
            return res.status(400).json({ error: 'Dados incorretos' });
        }
        
        const usuario = await usuarioService.criarUsuario(dados);

        if (!usuario) {
            return res.status(404).json({
                 error: 'Erro ao criar usuário' });
        }

        return res.status(201).json(usuario);
    }

    async atualizarUsuario(req, res) {
        const { id } = req.params;
        const { dados } = req.body || {};

        if(id == undefined || id == null) {
            return res.status(400).json({ error: 'Id incorreto' });
        }

        if(dados == undefined || dados == null) {
            return res.status(400).json({ error: 'Dados incorretos' });
        }

        const usuario = await usuarioService.atualizarUsuario(id, dados);

        if (!usuario) {
            return res.status(404).json({ error: 'Usuário não encontrado' });
        }

        return res.status(201).json(usuario);
    }

    async deletarUsuario(req, res) {
        const { id } = req.params;

        if(id == undefined || id == null) {
            return res.status(400).json({ error: 'Id incorreto' });
        }

        const usuario = await usuarioService.deletarUsuario(id);

        if (!usuario) {
            return res.status(404).json({ error: 'Erro ao deletar usuário' });
        }

        return res.status(204).send();
    }
}

module.exports = new UsuarioController();
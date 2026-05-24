const prisma = require('../lib/prisma');

class UsuarioService {
    async listarUsuarios() {
        return await prisma.usuario.findMany();
    };

    async buscarUsuarioPorId(id) {
        return await prisma.usuario.findUnique({
            where: { id_usuario: Number(id) }
        });
    }

    async criarUsuario(dados) {
        return await prisma.usuario.create({
            data: dados
        });
    }

    async atualizarUsuario(id, dados) {
        return await prisma.usuario.update({
            where: { id_usuario: Number(id) },
            data: dados
        });
    }

    async deletarUsuario(id) {
        return await prisma.usuario.delete({
            where: { id_usuario: Number(id) }
        });
    }
}

module.exports = new UsuarioService();
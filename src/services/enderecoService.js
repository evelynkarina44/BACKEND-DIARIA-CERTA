const prisma = require('../lib/prisma');

class EnderecoService {
    async listarEnderecos() {
        return await prisma.endereco.findMany();
    }

    async buscarEnderecoPorId(id) {
        return await prisma.endereco.findUnique({
            where: { id_endereco: Number(id) }
        });
    }

    async criarEndereco(dados) {
        return await prisma.endereco.create({
            data: dados
        });
    }

    async atualizarEndereco(id, dados) {
        return await prisma.endereco.update({
            where: { id_endereco: Number(id) },
            data: dados
        });
    }

    async deletarEndereco(id) {
        return await prisma.endereco.delete({
            where: { id_endereco: Number(id) }
        });
    }
}

module.exports = new EnderecoService();
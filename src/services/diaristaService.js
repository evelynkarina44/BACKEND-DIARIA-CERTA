const prisma = require('../lib/prisma');

class DiaristaService {
    async listarDiaristas() {
        return await prisma.diarista.findMany();
    }

    async buscarDiaristaPorId(id) {
        return await prisma.diarista.findUnique({
            where: { id_diarista: Number(id) }
        });
    }

    async criarDiarista(dados) {
        return await prisma.diarista.create({
            data: dados
        });
    }

    async atualizarDiarista(id, dados) {
        return await prisma.diarista.update({
            where: { id_diarista: Number(id) },
            data: dados
        });
    }

    async deletarDiarista(id) {
        return await prisma.diarista.delete({
            where: { id_diarista: Number(id) }
        });
    }
}

module.exports = new DiaristaService();
const prisma = require('../lib/prisma');

class ComboBaseService {
    async listarComboBases() {
        return await prisma.combo_base.findMany();
    };

    async buscarComboBasePorId(id) {
        return await prisma.combo_base.findUnique({
            where: { id_combo_base: Number(id) }
        });
    }

    async criarComboBase(dados) {
        return await prisma.combo_base.create({
            data: dados
        });
    }

    async atualizarComboBase(id, dados) {
        return await prisma.combo_base.update({
            where: { id_combo_base: Number(id) },
            data: dados
        });
    }

    async deletarComboBase(id) {
        return await prisma.combo_base.delete({
            where: { id_combo_base: Number(id) }
        });
    }
}

module.exports = new ComboBaseService();

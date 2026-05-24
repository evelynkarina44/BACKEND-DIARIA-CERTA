const prisma = require('../lib/prisma');


class ClienteService {
    async listarClientes() {
        return await prisma.cliente.findMany();
    }

    async buscarClientePorId(id) {
        return await prisma.cliente.findUnique({
            where: { id_cliente: Number(id) }
        });
    }

    async criarCliente(dados) {
        return await prisma.cliente.create({
            data: dados
        });
    }

    async atualizarCliente(id, dados) {
        return await prisma.cliente.update({
            where: { id_cliente: Number(id) },
            data: dados
        });
    }

    async deletarCliente(id) {
        return await prisma.cliente.delete({
            where: { id_cliente: Number(id) }
        });
    }
}

module.exports = new ClienteService();
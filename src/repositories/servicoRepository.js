import prisma from "../lib/prisma";
import { DatabaseError } from "../errors/DatabaseError";

export class ServicoRepository {
    async findAll() {
        try {
            return await prisma.servico.findMany();
        } catch (error) {
            throw new DatabaseError(
                "Failed to find servicos",
                error.message
            );
        }
    };

    async findById(id) {
        try {
            return await prisma.servico.findUnique({
                where: { id_servico: Number(id) }
            });
        } catch (error) {
            throw new DatabaseError(
                "Failed to find servico",
                error.message
            );
        }
    }

    async create(dados) {
        try {
            return await prisma.servico.create({
                data: dados
            });
        } catch (error) {
            throw new DatabaseError(
                "Failed to create servico",
                error.message
            );
        }
    }

    async update(id, dados) {
        try {
            return await prisma.servico.update({
                where: { id_servico: Number(id) },
                data: dados
            });
        } catch (error) {
            throw new DatabaseError(
                "Failed to update servico",
                error.message
            );
        }
    }

    async delete(id) {
        try {
            return await prisma.servico.delete({
                where: { id_servico: Number(id) }
            });
        } catch (error) {
            throw new DatabaseError(
                "Failed to delete servico",
                error.message
            );
        }
    }
}
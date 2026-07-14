import prisma from "../lib/prisma";
import { DatabaseError } from "../errors/DatabaseError";

export class AvaliacaoRepository {
    async findAll() {
        try {
            return await prisma.avaliacao.findMany();
        } catch (error) {
            throw new DatabaseError(
                "Failed to create avaliacao",
                error.message
            );
        }
    };

    async findById(id_avaliacao) {
        try {
            return await prisma.avaliacao.findUnique({
                where: { id_avaliacao: Number(id_avaliacao) }
            });
        } catch (error) {
            throw new DatabaseError(
                "Failed to find avaliacao",
                error.message
            );
        }
    }

    async create(dados) {
        try {
            return await prisma.avaliacao.create({
                data: dados
            });
        } catch (error) {
            throw new DatabaseError(
                "Failed to create avaliacao",
                error.message
            );
        }
    }

    async update(id_avaliacao, dados) {
        try {
            return await prisma.avaliacao.update({
                where: { id_avaliacao: Number(id_avaliacao) },
                data: dados
            });
        } catch (error) {
            throw new DatabaseError(
                "Failed to update avaliacao",
                error.message
            );
        }
    }

    async delete(id_avaliacao) {
        try {
            return await prisma.avaliacao.delete({
                where: { id_avaliacao: Number(id_avaliacao) }
            });
        } catch (error) {
            throw new DatabaseError(
                "Failed to delete avaliacao",
                error.message
            );
        }
    }
}
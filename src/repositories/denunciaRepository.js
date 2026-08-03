import prisma from "../lib/prisma";
import { DatabaseError } from "../errors/DatabaseError";

export class DenunciaRepository {
    async findAll() {
        try {
            return await prisma.denuncia.findMany();
        } catch (error) {
            throw new DatabaseError(
                "Failed to find denuncias",
                error.message
            );
        }
    };

    async findById(id) {
        try {
            return await prisma.denuncia.findUnique({
                where: { id_denuncia: Number(id) }
            });
        } catch (error) {
            throw new DatabaseError(
                "Failed to find denuncia",
                error.message
            );
        }
    }

    async create(dados) {
        try {
            return await prisma.denuncia.create({
                data: dados
            });
        } catch (error) {
            throw new DatabaseError(
                "Failed to create denuncia",
                error.message
            );
        }
    }

    async update(id, dados) {
        try {
            return await prisma.denuncia.update({
                where: { id_denuncia: Number(id) },
                data: dados
            });
        } catch (error) {
            throw new DatabaseError(
                "Failed to update denuncia",
                error.message
            );
        }
    }

    async delete(id) {
        try {
            return await prisma.denuncia.delete({
                where: { id_denuncia: Number(id) }
            });
        } catch (error) {
            throw new DatabaseError(
                "Failed to delete denuncia",
                error.message
            );
        }
    }
}
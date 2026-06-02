import prisma from "../lib/prisma";
import { DatabaseError } from "../errors/DatabaseError";

export class DiamistaRepository {
    async findAll() {
        try {
            return await prisma.diarista.findMany();
        } catch (error) {
            throw new DatabaseError(
                "Failed to find diaristas",
                error.message
            );
        }
    };

    async findById(id) {
        try {
            return await prisma.diarista.findUnique({
                where: { id_diarista: Number(id) }
            });
        } catch (error) {
            throw new DatabaseError(
                "Failed to find diarista",
                error.message
            );
        }
    }

    async create(dados) {
        try {
            return await prisma.diarista.create({
                data: dados
            });
        } catch (error) {
            throw new DatabaseError(
                "Failed to create diarista",
                error.message
            );
        }
    }

    async update(id, dados) {
        try {
            return await prisma.diarista.update({
                where: { id_diarista: Number(id) },
                data: dados
            });
        } catch (error) {
            throw new DatabaseError(
                "Failed to update diarista",
                error.message
            );
        }
    }

    async delete(id) {
        try {
            return await prisma.diarista.delete({
                where: { id_diarista: Number(id) }
            });
        } catch (error) {
            throw new DatabaseError(
                "Failed to delete diarista",
                error.message
            );
        }
    }
}
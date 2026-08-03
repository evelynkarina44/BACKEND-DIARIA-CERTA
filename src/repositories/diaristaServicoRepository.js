import prisma from "../lib/prisma";
import { DatabaseError } from "../errors/DatabaseError";

export class DiaristaServicoRepository {
    async findAll() {
        try {
            return await prisma.diarista_servico.findMany();
        } catch (error) {
            throw new DatabaseError(
                "Failed to find diarista_servicos",
                error.message
            );
        }
    };

    async findById(id) {
        try {
            return await prisma.diarista_servico.findUnique({
                where: { id_diarista_servico: Number(id) }
            });
        } catch (error) {
            throw new DatabaseError(
                "Failed to find diarista_servico",
                error.message
            );
        }
    }

    async create(dados) {
        try {
            return await prisma.diarista_servico.create({
                data: dados
            });
        } catch (error) {
            throw new DatabaseError(
                "Failed to create diarista_servico",
                error.message
            );
        }
    }

    async update(id, dados) {
        try {
            return await prisma.diarista_servico.update({
                where: { id_diarista_servico: Number(id) },
                data: dados
            });
        } catch (error) {
            throw new DatabaseError(
                "Failed to update diarista_servico",
                error.message
            );
        }
    }

    async delete(id) {
        try {
            return await prisma.diarista_servico.delete({
                where: { id_diarista_servico: Number(id) }
            });
        } catch (error) {
            throw new DatabaseError(
                "Failed to delete diarista_servico",
                error.message
            );
        }
    }
}
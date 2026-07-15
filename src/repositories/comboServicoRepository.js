import prisma from "../lib/prisma";
import { DatabaseError } from "../errors/DatabaseError";

export class ComboServicoRepository {
    async findAll() {
        try {
            return await prisma.combo_servico.findMany();
        } catch (error) {
            throw new DatabaseError(
                "Failed to find combo services",
                error.message
            );
        }
    };

    async findById(id) {
        try {
            return await prisma.combo_servico.findUnique({
                where: { id_combo_servico: Number(id) }
            });
        } catch (error) {
            throw new DatabaseError(
                "Failed to find combo service",
                error.message
            );
        }
    }

    async create(dados) {
        try {
            return await prisma.combo_servico.create({
                data: dados
            });
        } catch (error) {
            throw new DatabaseError(
                "Failed to create combo service",
                error.message
            );
        }
    }

    async update(id, dados) {
        try {
            return await prisma.combo_servico.update({
                where: { id_combo_servico: Number(id) },
                data: dados
            });
        } catch (error) {
            throw new DatabaseError(
                "Failed to update combo service",
                error.message
            );
        }
    }

    async delete(id) {
        try {
            return await prisma.combo_servico.delete({
                where: { id_combo_servico: Number(id) }
            });
        } catch (error) {
            throw new DatabaseError(
                "Failed to delete combo service",
                error.message
            );
        }
    }
}
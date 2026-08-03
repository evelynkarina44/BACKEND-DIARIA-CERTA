import prisma from "../lib/prisma";
import { DatabaseError } from "../errors/DatabaseError";

export class ComboBaseRepository {
    async findAll() {
        try {
            return await prisma.combo_base.findMany();
        } catch (error) {
            throw new DatabaseError(
                "Failed to find combo bases",
                error.message
            );
        }
    };

    async findById(id) {
        try {
            return await prisma.combo_base.findUnique({
                where: { id_combo_base: Number(id) }
            });
        } catch (error) {
            throw new DatabaseError(
                "Failed to find combo base",
                error.message
            );
        }
    }

    async create(dados) {
        try {
            return await prisma.combo_base.create({
                data: dados
            });
        } catch (error) {
            throw new DatabaseError(
                "Failed to create combo base",
                error.message
            );
        }
    }

    async update(id, dados) {
        try {
            return await prisma.combo_base.update({
                where: { id_combo_base: Number(id) },
                data: dados
            });
        } catch (error) {
            throw new DatabaseError(
                "Failed to update combo base",
                error.message
            );
        }
    }

    async delete(id) {
        try {
            return await prisma.combo_base.delete({
                where: { id_combo_base: Number(id) }
            });
        } catch (error) {
            throw new DatabaseError(
                "Failed to delete combo base",
                error.message
            );
        }
    }
}
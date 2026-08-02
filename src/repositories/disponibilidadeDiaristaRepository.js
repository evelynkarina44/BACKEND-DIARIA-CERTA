import prisma from "../lib/prisma";
import { DatabaseError } from "../errors/DatabaseError";

export class DisponibilidadeDiaristaRepository {
    async findAll() {
        try {
            return await prisma.disponibilidadeDiarista.findMany();
        } catch (error) {
            throw new DatabaseError(
                "Failed to find disponibilidadeDiaristas",
                error.message
            );
        }
    };

    async findById(id) {
        try {
            return await prisma.disponibilidadeDiarista.findUnique({
                where: { id_agenda: Number(id) }
            });
        } catch (error) {
            throw new DatabaseError(
                "Failed to find disponibilidadeDiarista",
                error.message
            );
        }
    }

    async create(dados) {
        try {
            return await prisma.disponibilidadeDiarista.create({
                data: dados
            });
        } catch (error) {
            throw new DatabaseError(
                "Failed to create disponibilidadeDiarista",
                error.message
            );
        }
    }

    async update(id, dados) {
        try {
            return await prisma.disponibilidadeDiarista.update({
                where: { id_agenda: Number(id) },
                data: dados
            });
        } catch (error) {
            throw new DatabaseError(
                "Failed to update disponibilidadeDiarista",
                error.message
            );
        }
    }

    async delete(id) {
        try {
            return await prisma.disponibilidadeDiarista.delete({
                where: { id_agenda: Number(id) }
            });
        } catch (error) {
            throw new DatabaseError(
                "Failed to delete disponibilidadeDiarista",
                error.message
            );
        }
    }
}
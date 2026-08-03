import prisma from "../lib/prisma";
import { DatabaseError } from "../errors/DatabaseError";

export class UserRepository {
    async findAll() {
        try {
            return await prisma.usuario.findMany();
        } catch (error) {
            throw new DatabaseError(
                "Failed to find usuarios",
                error.message
            );
        }
    };

    async findById(id_usuario) {
        try {
            return await prisma.usuario.findUnique({
                where: { id_usuario: Number(id_usuario) }
            });
        } catch (error) {
            throw new DatabaseError(
                "Failed to find usuario",
                error.message
            );
        }
    }

    async create(dados) {
        try {
            return await prisma.usuario.create({
                data: dados
            });
        } catch (error) {
            throw new DatabaseError(
                "Failed to create usuario",
                error.message
            );
        }
    }

    async update(id_usuario, dados) {
        try {
            return await prisma.usuario.update({
                where: { id_usuario: Number(id_usuario) },
                data: dados
            });
        } catch (error) {
            throw new DatabaseError(
                "Failed to update usuario",
                error.message
            );
        }
    }

    async delete(id_usuario) {
        try {
            return await prisma.usuario.delete({
                where: { id_usuario: Number(id_usuario) }
            });
        } catch (error) {
            throw new DatabaseError(
                "Failed to delete usuario",
                error.message
            );
        }
    }
}
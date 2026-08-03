import prisma from "../lib/prisma";
import { DatabaseError } from "../errors/DatabaseError";

export class FavoritoRepository {
    async findAll() {
        try {
            return await prisma.favorito.findMany();
        } catch (error) {
            throw new DatabaseError(
                "Failed to find favoritos",
                error.message
            );
        }
    };

    async findById(id) {
        try {
            return await prisma.favorito.findUnique({
                where: { id_favorito: Number(id) }
            });
        } catch (error) {
            throw new DatabaseError(
                "Failed to find favorito",
                error.message
            );
        }
    }

    async create(dados) {
        try {
            return await prisma.favorito.create({
                data: dados
            });
        } catch (error) {
            throw new DatabaseError(
                "Failed to create favorito",
                error.message
            );
        }
    }

    async update(id, dados) {
        try {
            return await prisma.favorito.update({
                where: { id_favorito: Number(id) },
                data: dados
            });
        } catch (error) {
            throw new DatabaseError(
                "Failed to update favorito",
                error.message
            );
        }
    }

    async delete(id) {
        try {
            return await prisma.favorito.delete({
                where: { id_favorito: Number(id) }
            });
        } catch (error) {
            throw new DatabaseError(
                "Failed to delete favorito",
                error.message
            );
        }
    }
}
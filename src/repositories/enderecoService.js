import prisma from "../lib/prisma";
import { DatabaseError } from "../errors/DatabaseError";

export class EnderecoRepository {
    async findAll() {
        try {
            return await prisma.endereco.findMany();
        } catch (error) {
            throw new DatabaseError(
                "Failed to find enderecos",
                error.message
            );
        }
    };

    async findById(id) {
        try {
            return await prisma.endereco.findUnique({
                where: { id_endereco: Number(id) }
            });
        } catch (error) {
            throw new DatabaseError(
                "Failed to find endereco",
                error.message
            );
        }
    }

    async create(dados) {
        try {
            return await prisma.endereco.create({
                data: dados
            });
        } catch (error) {
            throw new DatabaseError(
                "Failed to create endereco",
                error.message
            );
        }
    }

    async update(id, dados) {
        try {
            return await prisma.endereco.update({
                where: { id_endereco: Number(id) },
                data: dados
            });
        } catch (error) {
            throw new DatabaseError(
                "Failed to update endereco",
                error.message
            );
        }
    }

    async delete(id) {
        try {
            return await prisma.endereco.delete({
                where: { id_endereco: Number(id) }
            });
        } catch (error) {
            throw new DatabaseError(
                "Failed to delete endereco",
                error.message
            );
        }
    }
}
import prisma from "../lib/prisma";
import { DatabaseError } from "../errors/DatabaseError";

export class ClienteRepository {
    async findAll() {
        try {
            return await prisma.cliente.findMany();
        } catch (error) {
            throw new DatabaseError(
                "Failed to create user",
                error.message
            );
        }
    };

    async findById(id_cliente) {
        try {
            return await prisma.cliente.findUnique({
                where: { id_cliente: Number(id_cliente) }
            });
        } catch (error) {
            throw new DatabaseError(
                "Failed to find user",
                error.message
            );
        }
    }

    async findByIdUsuario(id_usuario) {
        try {
            return await prisma.cliente.findUnique({
                where: { id_usuario: Number(id_usuario) }
            });
        } catch (error) {
            throw new DatabaseError(
                "Failed to find user",
                error.message
            );
        }
    }

    async create(dados) {
        try {
            return await prisma.cliente.create({
                data: dados
            });
        } catch (error) {
            throw new DatabaseError(
                "Failed to create user",
                error.message
            );
        }
    }

    async update(id_cliente, dados) {
        try {
            return await prisma.cliente.update({
                where: { id_cliente: Number(id_cliente) },
                data: dados
            });
        } catch (error) {
            throw new DatabaseError(
                "Failed to update user",
                error.message
            );
        }
    }

    async delete(id_cliente) {
        try {
            return await prisma.cliente.delete({
                where: { id_cliente: Number(id_cliente) }
            });
        } catch (error) {
            throw new DatabaseError(
                "Failed to delete user",
                error.message
            );
        }
    }
}
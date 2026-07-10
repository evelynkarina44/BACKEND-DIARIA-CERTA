import prisma from "../lib/prisma";
import { DatabaseError } from "../errors/DatabaseError";

export class AgendamentoRepository {
    async findAll() {
        try {
            return await prisma.agendamento.findMany();
        } catch (error) {
            throw new DatabaseError(
                "Failed to create agendamento",
                error.message
            );
        }
    };

    async findById(id_agendamento) {
        try {
            return await prisma.agendamento.findUnique({
                where: { id_agendamento: Number(id_agendamento) }
            });
        } catch (error) {
            throw new DatabaseError(
                "Failed to find agendamento",
                error.message
            );
        }
    }

    async create(dados) {
        try {
            return await prisma.agendamento.create({
                data: dados
            });
        } catch (error) {
            throw new DatabaseError(
                "Failed to create agendamento",
                error.message
            );
        }
    }

    async update(id_agendamento, dados) {
        try {
            return await prisma.agendamento.update({
                where: { id_agendamento: Number(id_agendamento) },
                data: dados
            });
        } catch (error) {
            throw new DatabaseError(
                "Failed to update agendamento",
                error.message
            );
        }
    }

    async delete(id_agendamento) {
        try {
            return await prisma.agendamento.delete({
                where: { id_agendamento: Number(id_agendamento) }
            });
        } catch (error) {
            throw new DatabaseError(
                "Failed to delete agendamento",
                error.message
            );
        }
    }
}
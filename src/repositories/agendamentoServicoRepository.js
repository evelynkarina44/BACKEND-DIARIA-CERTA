import prisma from "../lib/prisma";
import { DatabaseError } from "../errors/DatabaseError";

export class AgendamentoServicoRepository {
    async findAll() {
        try {
            return await prisma.agendamentoServico.findMany();
        } catch (error) {
            throw new DatabaseError(
                "Failed to create agendamento Servico",
                error.message
            );
        }
    };

    async findById(id) {
        try {
            return await prisma.agendamento.findUnique({
                where: { id: Number(id) }
            });
        } catch (error) {
            throw new DatabaseError(
                "Failed to find agendamento Servico",
                error.message
            );
        }
    }

    async create(dados) {
        try {
            return await prisma.agendamentoServico.create({
                data: dados
            });
        } catch (error) {
            throw new DatabaseError(
                "Failed to create agendamento Servico",
                error.message
            );
        }
    }

    async update(id, dados) {
        try {
            return await prisma.agendamentoServico.update({
                where: { id: Number(id) },
                data: dados
            });
        } catch (error) {
            throw new DatabaseError(
                "Failed to update agendamento Servico",
                error.message
            );
        }
    }

    async delete(id) {
        try {
            return await prisma.agendamentoServico.delete({
                where: { id: Number(id) }
            });
        } catch (error) {
            throw new DatabaseError(
                "Failed to delete agendamento Servico",
                error.message
            );
        }
    }
}
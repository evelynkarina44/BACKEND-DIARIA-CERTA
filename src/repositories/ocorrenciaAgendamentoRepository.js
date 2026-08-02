import prisma from "../lib/prisma";
import { DatabaseError } from "../errors/DatabaseError";

export class OcorrenciaAgendamentoRepository {
    async findAll() {
        try {
            return await prisma.ocorrencia_agendamento.findMany();
        } catch (error) {
            throw new DatabaseError(
                "Failed to find ocorrências de agendamento",
                error.message
            );
        }
    };

    async findById(id) {
        try {
            return await prisma.ocorrencia_agendamento.findUnique({
                where: { id_ocorrencia: Number(id) }
            });
        } catch (error) {
            throw new DatabaseError(
                "Failed to find ocorrência de agendamento",
                error.message
            );
        }
    }

    async create(dados) {
        try {
            return await prisma.ocorrencia_agendamento.create({
                data: dados
            });
        } catch (error) {
            throw new DatabaseError(
                "Failed to create ocorrência de agendamento",
                error.message
            );
        }
    }

    async update(id, dados) {
        try {
            return await prisma.ocorrencia_agendamento.update({
                where: { id_ocorrencia: Number(id) },
                data: dados
            });
        } catch (error) {
            throw new DatabaseError(
                "Failed to update ocorrência de agendamento",
                error.message
            );
        }
    }

    async delete(id) {
        try {
            return await prisma.ocorrencia_agendamento.delete({
                where: { id_ocorrencia: Number(id) }
            });
        } catch (error) {
            throw new DatabaseError(
                "Failed to delete ocorrência de agendamento",
                error.message
            );
        }
    }
}
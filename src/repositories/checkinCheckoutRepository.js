import prisma from "../lib/prisma";
import { DatabaseError } from "../errors/DatabaseError";

export class CheckinCheckoutRepository {
    async findAll() {
        try {
            return await prisma.checkinCheckout.findMany();
        } catch (error) {
            throw new DatabaseError(
                "Failed to create checkinCheckout",
                error.message
            );
        }
    };

    async findById(id_check) {
        try {
            return await prisma.checkinCheckout.findUnique({
                where: { id_check: Number(id_check) }
            });
        } catch (error) {
            throw new DatabaseError(
                "Failed to find checkinCheckout",
                error.message
            );
        }
    }

    async create(dados) {
        try {
            return await prisma.checkinCheckout.create({
                data: dados
            });
        } catch (error) {
            throw new DatabaseError(
                "Failed to create checkinCheckout",
                error.message
            );
        }
    }

    async update(id_check, dados) {
        try {
            return await prisma.checkinCheckout.update({
                where: { id_check: Number(id_check) },
                data: dados
            });
        } catch (error) {
            throw new DatabaseError(
                "Failed to update checkinCheckout",
                error.message
            );
        }
    }

    async delete(id_check) {
        try {
            return await prisma.checkinCheckout.delete({
                where: { id_check: Number(id_check) }
            });
        } catch (error) {
            throw new DatabaseError(
                "Failed to delete checkinCheckout",
                error.message
            );
        }
    }
}
import { Prisma } from "@prisma/client";
import { AppError } from "../errors/AppError.js";

export function notFoundMiddleware(req, res) {
  return res.status(404).json({
    error: { code: "ROUTE_NOT_FOUND", message: "Rota não encontrada." },
  });
}

export function errorMiddleware(error, req, res, next) {
  if (res.headersSent) return next(error);

  if (error instanceof AppError) {
    const response = { error: { code: error.code, message: error.message } };
    if (error.details) response.error.details = error.details;
    return res.status(error.statusCode).json(response);
  }

  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === "P2002") {
      return res.status(409).json({ error: { code: "RESOURCE_ALREADY_EXISTS", message: "Já existe um registro com estes dados." } });
    }
    if (error.code === "P2025") {
      return res.status(404).json({ error: { code: "RESOURCE_NOT_FOUND", message: "Registro não encontrado." } });
    }
  }

  if (process.env.NODE_ENV !== "test") console.error(error);
  return res.status(500).json({
    error: { code: "INTERNAL_SERVER_ERROR", message: "Ocorreu um erro interno." },
  });
}

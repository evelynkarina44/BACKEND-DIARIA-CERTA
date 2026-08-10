import { Prisma } from '@prisma/client';
import { AppError } from '../errors/AppError.js';

export function notFoundHandler(req, res) {
  return res.status(404).json({
    error: 'Rota não encontrada',
    method: req.method,
    path: req.originalUrl,
  });
}

export function errorHandler(error, req, res, _next) {
  if (res.headersSent) {
    return _next(error);
  }

  if (error instanceof SyntaxError && error.status === 400 && 'body' in error) {
    return res.status(400).json({ error: 'JSON malformado' });
  }

  if (error instanceof AppError) {
    return res.status(error.statusCode).json({
      error: error.message,
      ...(error.details ? { details: error.details } : {}),
    });
  }

  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    const prismaErrors = {
      P2002: [409, 'Registro duplicado'],
      P2003: [409, 'Operação impedida por um relacionamento existente'],
      P2025: [404, 'Registro não encontrado'],
    };
    const [status, message] = prismaErrors[error.code] ?? [500, 'Erro ao acessar o banco de dados'];
    return res.status(status).json({ error: message });
  }

  if (process.env.NODE_ENV !== 'test') {
    console.error(error);
  }

  return res.status(500).json({ error: 'Erro interno do servidor' });
}

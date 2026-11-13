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

  if (error.type === 'entity.too.large') {
    return res.status(413).json({ error: req.originalUrl?.startsWith('/api/usuario/foto') ? 'A imagem deve ter até 5 MB.' : 'Arquivo ou conteúdo enviado muito grande.' });
  }

  if (error instanceof AppError) {
    return res.status(error.statusCode).json({
      error: error.message,
      ...(error.details ? { details: error.details } : {}),
    });
  }

  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    // O índice único é a proteção final quando duas requisições passam pela
    // consulta antecipada ao mesmo tempo. Não expor detalhes internos do Prisma.
    const usuario = String(error.meta?.modelName ?? '').toLowerCase() === 'usuario'
      || /^\/api\/usuario(?:\/|$)/.test(req.originalUrl ?? '');
    const target = Array.isArray(error.meta?.target) ? error.meta.target.join(' ') : String(error.meta?.target ?? '');
    if (error.code === 'P2002' && usuario) {
      const field = /(?:^|[_.\s`])cpf(?:$|[_.\s`])/i.test(target) ? 'cpf'
        : /(?:^|[_.\s`])email(?:$|[_.\s`])/i.test(target) ? 'email' : null;
      if (field) {
        const label = field === 'cpf' ? 'CPF' : 'E-mail';
        return res.status(409).json({
          error: `${label} já cadastrado`,
          details: { fieldErrors: { [field]: [`Este ${label} já possui uma conta. Entre na conta existente.`] } },
        });
      }
    }
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

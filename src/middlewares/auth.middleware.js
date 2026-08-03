import { AppError } from "../errors/AppError.js";
import { verifyToken } from "../lib/jwt.js";
import { UserRepository } from "../repositories/userRepository.js";

const userRepository = new UserRepository();

export async function authenticate(req, res, next) {
  const authorization = req.headers.authorization;
  if (!authorization?.startsWith("Bearer ")) {
    return next(new AppError("Autenticação necessária.", 401, "AUTHENTICATION_REQUIRED"));
  }

  try {
    const payload = verifyToken(authorization.slice(7));
    const user = await userRepository.findAuthStateById(Number(payload.sub));
    if (!user || !user.ativo || user.bloqueado) {
      throw new AppError("Usuário inativo, bloqueado ou inexistente.", 401, "USER_NOT_ACTIVE");
    }
    req.user = { id: user.id_usuario, tipo: user.tipo };
    next();
  } catch (error) {
    next(error);
  }
}

export function authorize(...types) {
  return (req, res, next) => {
    if (!req.user || !types.includes(req.user.tipo)) {
      return next(new AppError("Você não possui permissão para esta ação.", 403, "FORBIDDEN"));
    }
    next();
  };
}

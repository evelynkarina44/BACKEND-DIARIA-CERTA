import { AppError } from "../errors/AppError.js";
import { signToken } from "../lib/jwt.js";
import { hashPassword, verifyPassword } from "../lib/password.js";
import { UserRepository } from "../repositories/userRepository.js";

const userRepository = new UserRepository();

function normalizeCpf(value) {
  return value ? value.replace(/\D/g, "") : undefined;
}

export class AuthService {
  async register(input) {
    const email = input.email.toLowerCase();
    const cpf = normalizeCpf(input.cpf);
    if (await userRepository.findByEmail(email)) {
      throw new AppError("Já existe um usuário com este e-mail.", 409, "EMAIL_ALREADY_EXISTS");
    }
    if (cpf && await userRepository.findByCpf(cpf)) {
      throw new AppError("Já existe um usuário com este CPF.", 409, "CPF_ALREADY_EXISTS");
    }

    const { data_nascimento, qtd_comodos, tamanho_casa, descricao, qtd_max_comodos, ...user } = input;
    const perfil = input.tipo === "CLIENTE"
      ? { data_nascimento, qtd_comodos, tamanho_casa }
      : { descricao, qtd_max_comodos };

    const created = await userRepository.createWithProfile({
      nome: user.nome,
      email,
      senha: await hashPassword(user.senha),
      cpf,
      telefone: user.telefone,
      foto_perfil: user.foto_perfil ?? null,
      tipo: user.tipo,
      perfil,
    });

    return { user: created, token: signToken({ sub: String(created.id_usuario), tipo: created.tipo }) };
  }

  async login({ email, senha }) {
    const credentials = await userRepository.findCredentialsByEmail(email.toLowerCase());
    const valid = credentials ? await verifyPassword(senha, credentials.senha) : false;
    if (!valid) throw new AppError("E-mail ou senha inválidos.", 401, "INVALID_CREDENTIALS");
    if (!credentials.ativo || credentials.bloqueado) {
      throw new AppError("Usuário inativo ou bloqueado.", 403, "USER_NOT_ACTIVE");
    }

    const user = await userRepository.findPublicById(credentials.id_usuario);
    return { user, token: signToken({ sub: String(user.id_usuario), tipo: user.tipo }) };
  }

  getMe(id) {
    return userRepository.findPublicById(id);
  }

  async changePassword(id, { senha_atual, nova_senha }) {
    const current = await userRepository.findPublicById(id);
    const credentials = current ? await userRepository.findCredentialsByEmail(current.email) : null;
    if (!credentials || !(await verifyPassword(senha_atual, credentials.senha))) {
      throw new AppError("Senha atual inválida.", 401, "INVALID_CURRENT_PASSWORD");
    }
    await userRepository.updatePassword(id, await hashPassword(nova_senha));
  }
}

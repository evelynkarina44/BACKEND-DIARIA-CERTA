import prisma from "../lib/prisma.js";

const publicUserSelect = {
  id_usuario: true,
  nome: true,
  email: true,
  telefone: true,
  foto_perfil: true,
  tipo: true,
  ativo: true,
  data_cadastro: true,
  atualizado_em: true,
};

export class UserRepository {
  findByEmail(email) {
    return prisma.usuario.findUnique({ where: { email }, select: publicUserSelect });
  }

  findByCpf(cpf) {
    return prisma.usuario.findUnique({ where: { cpf }, select: { id_usuario: true } });
  }

  findCredentialsByEmail(email) {
    return prisma.usuario.findUnique({
      where: { email },
      select: { id_usuario: true, email: true, senha: true, tipo: true, ativo: true, bloqueado: true },
    });
  }

  findAuthStateById(id_usuario) {
    return prisma.usuario.findUnique({
      where: { id_usuario },
      select: { id_usuario: true, tipo: true, ativo: true, bloqueado: true },
    });
  }

  findPublicById(id_usuario) {
    return prisma.usuario.findUnique({ where: { id_usuario }, select: publicUserSelect });
  }

  createWithProfile(data) {
    const { perfil, ...userData } = data;
    const relation = userData.tipo === "CLIENTE" ? "cliente" : "diarista";
    return prisma.usuario.create({
      data: { ...userData, [relation]: { create: perfil } },
      select: publicUserSelect,
    });
  }

  updatePublicData(id_usuario, data) {
    return prisma.usuario.update({ where: { id_usuario }, data, select: publicUserSelect });
  }

  updatePassword(id_usuario, senha) {
    return prisma.usuario.update({ where: { id_usuario }, data: { senha }, select: { id_usuario: true } });
  }
}

export { publicUserSelect };

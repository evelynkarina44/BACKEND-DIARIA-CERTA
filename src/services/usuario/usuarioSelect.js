export const usuarioPublicSelect = {
  id_usuario: true,
  nome: true,
  email: true,
  telefone: true,
  foto_perfil: true,
  data_cadastro: true,
  cliente: { select: { id_cliente: true } },
  diarista: { select: { id_diarista: true } },
};

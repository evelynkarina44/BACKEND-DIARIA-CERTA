import { ForbiddenError, NotFoundError } from '../../errors/index.js';

export function assertEnderecoOwner(endereco, auth) {
  if (!endereco) throw new NotFoundError('Endereço não encontrado');
  if (endereco.id_cliente !== auth?.id_cliente && endereco.id_diarista !== auth?.id_diarista) {
    throw new ForbiddenError('Endereço pertence a outro usuário');
  }
}

export function assertRequestedOwner(data, auth) {
  if (data.id_cliente && data.id_cliente !== auth?.id_cliente) throw new ForbiddenError('Perfil de cliente inválido');
  if (data.id_diarista && data.id_diarista !== auth?.id_diarista) throw new ForbiddenError('Perfil de diarista inválido');
}

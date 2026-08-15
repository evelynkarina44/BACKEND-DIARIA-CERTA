import test from 'node:test';
import assert from 'node:assert/strict';
import { AuthService } from '../src/services/auth/AuthService.js';
import { ForbiddenError } from '../src/errors/index.js';

test('seleção de perfil recusa perfil que não pertence ao usuário', async () => {
  const database = {
    usuario: {
      findUnique: async () => ({
        id_usuario: 1,
        nome: 'Maria Silva',
        email: 'maria@example.com',
        telefone: '11999999999',
        cliente: [{ id_cliente: 2 }],
        diarista: [],
      }),
    },
  };
  const service = new AuthService(database);

  await assert.rejects(
    () => service.selectProfile(1, 'DIARISTA'),
    (error) => error instanceof ForbiddenError,
  );
});

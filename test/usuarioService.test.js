import test from 'node:test';
import assert from 'node:assert/strict';
import bcrypt from 'bcryptjs';
import { CreateUsuarioService } from '../src/services/usuario/CreateUsuarioService.js';

test('CreateUsuarioService persiste hash e retorna projeção pública', async () => {
  let persisted;
  const repository = {
    findByEmail: async () => null,
    findByCpf: async () => null,
    create: async (data) => {
      persisted = data;
      const { senha: _senha, ...publicUser } = data;
      return { id_usuario: 1, ...publicUser };
    },
  };
  const service = new CreateUsuarioService(repository);
  const result = await service.execute({
    nome: 'Maria Silva',
    email: 'maria@example.com',
    senha: 'senha-segura',
    telefone: '11999999999',
    foto_perfil: '',
  });

  assert.notEqual(persisted.senha, 'senha-segura');
  assert.equal(await bcrypt.compare('senha-segura', persisted.senha), true);
  assert.equal('senha' in result, false);
});

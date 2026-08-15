import test from 'node:test';
import assert from 'node:assert/strict';
import jwt from 'jsonwebtoken';
import { buildSessionUser, createAuthSession } from '../src/services/auth/authSession.js';

const baseUser = {
  id_usuario: 7,
  nome: 'Maria Silva',
  email: 'maria@example.com',
  cliente: [],
  diarista: [],
};

test('sessão ativa automaticamente o único perfil disponível', () => {
  const user = buildSessionUser({ ...baseUser, cliente: [{ id_cliente: 3 }] });
  assert.deepEqual(user.profiles, ['CLIENTE']);
  assert.equal(user.activeProfile, 'CLIENTE');
  assert.equal(user.requiresProfileSelection, false);
});

test('sessão com dois perfis exige seleção explícita', () => {
  const user = buildSessionUser({
    ...baseUser,
    cliente: [{ id_cliente: 3 }],
    diarista: [{ id_diarista: 4 }],
  });
  assert.deepEqual(user.profiles, ['CLIENTE', 'DIARISTA']);
  assert.equal(user.activeProfile, null);
  assert.equal(user.requiresProfileSelection, true);
});

test('JWT registra somente o perfil ativo selecionado como contexto', () => {
  const previousSecret = process.env.JWT_SECRET;
  process.env.JWT_SECRET = 'segredo-de-teste-com-tamanho-suficiente';
  try {
    const session = createAuthSession({
      ...baseUser,
      cliente: [{ id_cliente: 3 }],
      diarista: [{ id_diarista: 4 }],
    }, 'DIARISTA');
    const payload = jwt.verify(session.token, process.env.JWT_SECRET, {
      issuer: 'diaria-certa-api',
      audience: 'diaria-certa-app',
    });
    assert.equal(session.user.activeProfile, 'DIARISTA');
    assert.equal(payload.activeProfile, 'DIARISTA');
  } finally {
    if (previousSecret === undefined) delete process.env.JWT_SECRET;
    else process.env.JWT_SECRET = previousSecret;
  }
});

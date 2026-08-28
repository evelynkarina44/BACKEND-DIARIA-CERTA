import test from 'node:test';
import assert from 'node:assert/strict';
import { syncUsuarioTipo } from '../src/services/usuario/syncUsuarioTipo.js';

function createDatabase({ cliente = null, diarista = null } = {}) {
  const updates = [];
  return {
    updates,
    cliente: { findUnique: async () => cliente },
    diarista: { findUnique: async () => diarista },
    usuario: {
      update: async (operation) => {
        updates.push(operation);
        return operation.data;
      },
    },
  };
}

test('marca o usuário como AMBOS quando possui cliente e diarista', async () => {
  const database = createDatabase({
    cliente: { id_cliente: 2 },
    diarista: { id_diarista: 3 },
  });

  const tipo = await syncUsuarioTipo(database, 7);

  assert.equal(tipo, 'AMBOS');
  assert.deepEqual(database.updates[0], {
    where: { id_usuario: 7 },
    data: { tipo: 'AMBOS' },
  });
});

test('mantém o tipo correspondente quando existe somente um perfil', async () => {
  const clienteDatabase = createDatabase({ cliente: { id_cliente: 2 } });
  const diaristaDatabase = createDatabase({ diarista: { id_diarista: 3 } });

  assert.equal(await syncUsuarioTipo(clienteDatabase, 8), 'CLIENTE');
  assert.equal(await syncUsuarioTipo(diaristaDatabase, 9), 'DIARISTA');
  assert.deepEqual(clienteDatabase.updates[0].data, { tipo: 'CLIENTE' });
  assert.deepEqual(diaristaDatabase.updates[0].data, { tipo: 'DIARISTA' });
});

test('não altera o tipo enquanto o usuário ainda não possui perfil', async () => {
  const database = createDatabase();

  assert.equal(await syncUsuarioTipo(database, 10), null);
  assert.equal(database.updates.length, 0);
});

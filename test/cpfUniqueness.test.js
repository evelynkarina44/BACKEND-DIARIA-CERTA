import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { Prisma } from '@prisma/client';
import { errorHandler } from '../src/middlewares/errorHandler.js';
import { UpdateUsuarioService } from '../src/services/usuario/UpdateUsuarioService.js';

function duplicate(meta) {
  return new Prisma.PrismaClientKnownRequestError('Internal unique constraint details', {
    code: 'P2002', clientVersion: '6.19.3', meta,
  });
}
function response(error, originalUrl = '/api/usuario') {
  let status, body;
  const res = { status(value) { status = value; return this; }, json(value) { body = value; return this; } };
  errorHandler(error, { originalUrl }, res, () => {});
  return { status, body };
}

test('Prisma declara unicidade do CPF usando o índice existente cpf', async () => {
  const schema = await readFile(new URL('../prisma/schema.prisma', import.meta.url), 'utf8');
  assert.match(schema, /cpf\s+String\?\s+@unique\(map: "cpf"\)\s+@db\.Char\(11\)/);
});

test('conflito atômico do banco retorna CPF já cadastrado, sem detalhes internos', () => {
  for (const target of ['cpf', ['cpf'], 'usuario_cpf_key']) {
    const result = response(duplicate({ modelName: 'usuario', target }));
    assert.equal(result.status, 409);
    assert.equal(result.body.error, 'CPF já cadastrado');
    assert.ok(result.body.details.fieldErrors.cpf);
    assert.equal(JSON.stringify(result.body).includes('Internal'), false);
  }
});

test('conflito de e-mail continua identificado e outras duplicidades não viram CPF', () => {
  assert.equal(response(duplicate({ modelName: 'usuario', target: 'email' })).body.error, 'E-mail já cadastrado');
  const unrelated = response(duplicate({ modelName: 'avaliacao', target: 'uq_agendamento_autor' }), '/api/avaliacao');
  assert.equal(unrelated.body.error, 'Registro duplicado');
});

test('não permite editar uma conta para usar CPF de outra; manter o próprio é permitido', async () => {
  let writes = 0;
  const repository = { findByCpf: async () => ({ id_usuario: 2 }), update: async () => { writes++; return {}; } };
  await assert.rejects(() => new UpdateUsuarioService(repository).execute(1, { cpf: '52998224725' }, { id_usuario: 1 }), (error) => {
    assert.equal(error.statusCode, 409); assert.ok(error.details.fieldErrors.cpf); return true;
  });
  assert.equal(writes, 0);
  repository.findByCpf = async () => ({ id_usuario: 1 });
  await new UpdateUsuarioService(repository).execute(1, { cpf: '52998224725' }, { id_usuario: 1 });
  assert.equal(writes, 1);
});

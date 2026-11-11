import test, { mock } from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { once } from 'node:events';
import { checkRegistrationSchema } from '../src/schemas/apiSchemas.js';
import { CheckUsuarioAvailabilityService } from '../src/services/usuario/CheckUsuarioAvailabilityService.js';
import { CreateUsuarioService } from '../src/services/usuario/CreateUsuarioService.js';
import { UserRepository } from '../src/repositories/userRepository.js';

const cpf = '52998224725'; // Dado de exemplo, consultas ao banco são simuladas.

test('consulta de cadastro valida CPF, normaliza e-mail e rejeita corpo vazio ou campos extras', () => {
  assert.equal(checkRegistrationSchema.safeParse({ cpf }).success, true);
  assert.equal(checkRegistrationSchema.parse({ email: ' TESTE@example.com ' }).email, 'teste@example.com');
  for (const input of [{}, { cpf: '11111111111' }, { cpf: 'abc' }, { email: 'invalido' }, { cpf, id_usuario: 1 }]) {
    assert.equal(checkRegistrationSchema.safeParse(input).success, false);
  }
});

test('CPF duplicado informa o campo sem devolver dados da conta existente', async () => {
  const service = new CheckUsuarioAvailabilityService({ findByCpf: async () => ({ id_usuario: 99, senha: 'privada' }) });
  await assert.rejects(() => service.execute({ cpf }), (error) => {
    assert.equal(error.statusCode, 409);
    assert.match(error.message, /CPF/);
    assert.match(error.details.fieldErrors.cpf[0], /conta/);
    assert.equal(JSON.stringify(error.details).includes('privada'), false);
    assert.equal(JSON.stringify(error.details).includes('99'), false);
    return true;
  });
});

test('aviso de conta existente identifica o perfil e orienta usar a mesma conta', async () => {
  const profiles = [
    ['CLIENTE', /conta de cliente.*também pode se tornar diarista.*mesma conta/],
    ['DIARISTA', /conta de diarista.*também pode ser cliente.*mesma conta/],
    ['AMBOS', /perfis de cliente e diarista.*escolha o perfil/],
    [null, /Entre nela para acessar ou adicionar outro perfil/],
  ];
  for (const [tipo, expected] of profiles) {
    for (const field of ['cpf', 'email']) {
      const repository = {
        findByCpf: async () => ({ tipo, senha: 'segredo' }),
        findByEmail: async () => ({ tipo, senha: 'segredo' }),
      };
      await assert.rejects(
        () => new CheckUsuarioAvailabilityService(repository).execute({ [field]: field === 'cpf' ? cpf : 'teste@example.com' }),
        (error) => {
          assert.equal(error.statusCode, 409);
          assert.match(error.details.fieldErrors[field][0], expected);
          assert.equal(JSON.stringify(error.details).includes('segredo'), false);
          return true;
        },
      );
    }
  }
});

test('e-mail duplicado é identificado como e-mail, não como CPF', async () => {
  const service = new CheckUsuarioAvailabilityService({ findByEmail: async (email) => {
    assert.equal(email, 'teste@example.com'); return {};
  } });
  await assert.rejects(() => service.execute({ email: ' TESTE@example.com ' }), (error) => {
    assert.equal(error.statusCode, 409);
    assert.ok(error.details.fieldErrors.email);
    return true;
  });
});

test('aprovação antecipada não cria conta e não substitui verificação final', async () => {
  let exists = false, writes = 0;
  const repository = { findByCpf: async () => exists ? {} : null, findByEmail: async () => null, create: async () => { writes++; } };
  assert.deepEqual(await new CheckUsuarioAvailabilityService(repository).execute({ cpf }), { disponivel: true });
  exists = true;
  await assert.rejects(() => new CreateUsuarioService(repository).execute({ cpf, email: 'teste@example.com', senha: 'Senha1234' }), /CPF já cadastrado/);
  assert.equal(writes, 0);
});

test('rota pública consulta sem autenticação, rejeita inválidos e limita tentativas em JSON', async () => {
  const { default: app } = await import('../src/app.js');
  let exists = false;
  const cpfMock = mock.method(UserRepository.prototype, 'findByCpf', async () => exists ? { id_usuario: 99 } : null);
  const server = createServer(app);
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  const url = `http://127.0.0.1:${server.address().port}/api/usuario/validar-cadastro`;
  const post = (data) => fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
  try {
    let response = await post({ cpf });
    assert.equal(response.status, 200);
    assert.equal(response.headers.get('cache-control'), 'no-store');
    assert.deepEqual(await response.json(), { disponivel: true });
    response = await post({ cpf: '123' });
    assert.equal(response.status, 422);
    assert.ok((await response.json()).details.fieldErrors.cpf);
    exists = true;
    response = await post({ cpf });
    assert.equal(response.status, 409);
    assert.ok((await response.json()).details.fieldErrors.cpf);
    exists = false;
    for (let index = 0; index < 30 && response.status !== 429; index++) response = await post({ cpf });
    assert.equal(response.status, 429);
    assert.match((await response.json()).error, /Muitas consultas/);
  } finally {
    server.closeAllConnections();
    await new Promise((resolve) => server.close(resolve));
    cpfMock.mock.restore();
  }
});

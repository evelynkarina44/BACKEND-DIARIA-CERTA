import test from 'node:test';
import assert from 'node:assert/strict';
import { getBirthDateError } from '../src/utils/birthDate.js';
import { createClienteSchema, updateClienteSchema, createDisponibilidadeSchema } from '../src/schemas/apiSchemas.js';

const now = new Date('2026-11-10T15:00:00Z');

test('nascimento rejeita futuro, dias inexistentes e entradas incompletas', () => {
  assert.match(getBirthDateError('2333-12-12', now), /futuro/);
  for (const value of ['2000-02-30', '2001-02-29', '2000-04-31', '2000-13-01', '2000-00-01', '0000-01-01', '', '12/12/2000', '2000-1-1']) {
    assert.match(getBirthDateError(value, now), /válida/);
  }
  assert.equal(getBirthDateError('2000-02-29', now), null);
});

test('idade mínima exige 18 anos completos, liberando no aniversário', () => {
  assert.equal(getBirthDateError('2008-11-10', now), null);
  assert.equal(getBirthDateError('2008-11-09', now), null);
  assert.match(getBirthDateError('2008-11-11', now), /18 anos/);
  assert.match(getBirthDateError('2026-11-10', now), /18 anos/);
  assert.match(getBirthDateError('2008-02-29', new Date('2026-02-28T15:00:00Z')), /18 anos/);
  assert.equal(getBirthDateError('2008-02-29', new Date('2026-03-01T15:00:00Z')), null);
});

test('aniversário segue São Paulo, não a meia-noite UTC', () => {
  assert.match(getBirthDateError('2008-11-11', new Date('2026-11-11T02:59:59Z')), /18 anos/);
  assert.equal(getBirthDateError('2008-11-11', new Date('2026-11-11T03:00:00Z')), null);
});

test('API bloqueia nascimento inválido na criação e edição; agenda continua aceitando futuro', () => {
  const profile = { id_usuario: 1, qtd_comodos: 2, tamanho_casa: 'pequena', endereco: {
    cep: '01001-000', logradouro: 'Rua Exemplo', numero: 1, bairro: 'Centro', cidade: 'São Paulo', estado: 'SP',
  } };
  const currentYear = Number(new Intl.DateTimeFormat('en', { timeZone: 'America/Sao_Paulo', year: 'numeric' }).format(new Date()));
  for (const value of ['2333-12-12', `${currentYear - 17}-01-01`, '2000-02-30']) {
    const result = createClienteSchema.safeParse({ ...profile, data_nascimento: value });
    assert.equal(result.success, false);
    assert.equal(result.error.issues[0].path[0], 'data_nascimento');
    assert.equal(updateClienteSchema.safeParse({ data_nascimento: value }).success, false);
  }
  assert.equal(createClienteSchema.safeParse({ ...profile, data_nascimento: '1990-01-01' }).success, true);
  assert.equal(createDisponibilidadeSchema.safeParse({ id_diarista: 1, dia_semana: '2333-12-12', horario_inicio: '08:00', horario_fim: '09:00' }).success, true);
});

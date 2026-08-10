import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createAgendamentoSchema,
  createEnderecoSchema,
  createUsuarioSchema,
} from '../src/schemas/apiSchemas.js';

test('schema de usuário normaliza e-mail', () => {
  const result = createUsuarioSchema.parse({
    nome: 'Maria Silva',
    email: '  MARIA@EXAMPLE.COM ',
    senha: 'senha-segura',
    telefone: '11999999999',
    foto_perfil: '',
  });
  assert.equal(result.email, 'maria@example.com');
});

test('endereço exige exatamente um proprietário', () => {
  const base = {
    bairro: 'Centro', cep: '01001-000', logradouro: 'Praça da Sé', numero: 1,
    cidade: 'São Paulo', estado: 'sp',
  };
  assert.equal(createEnderecoSchema.safeParse(base).success, false);
  assert.equal(createEnderecoSchema.safeParse({ ...base, id_cliente: 1, id_diarista: 2 }).success, false);
  assert.equal(createEnderecoSchema.safeParse({ ...base, id_cliente: 1 }).success, true);
});

test('agendamento rejeita intervalo invertido', () => {
  const result = createAgendamentoSchema.safeParse({
    id_diarista: 1,
    id_endereco: 1,
    data_agendamento: '2030-01-01',
    horario_inicio: '14:00',
    horario_fim: '13:00',
    qtd_comodos: 3,
    tamanho_residencia: 'pequena',
    servicos: [{ id_diarista_servico: 1 }],
  });
  assert.equal(result.success, false);
});

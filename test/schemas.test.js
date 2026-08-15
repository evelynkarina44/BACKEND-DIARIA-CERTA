import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createAgendamentoSchema,
  createClienteSchema,
  createDiaristaSchema,
  createEnderecoSchema,
  createUsuarioSchema,
} from '../src/schemas/apiSchemas.js';

const enderecoCadastro = {
  bairro: 'Centro',
  cep: '01001-000',
  logradouro: 'Praça da Sé',
  numero: 1,
  cidade: 'São Paulo',
  estado: 'SP',
};

test('schema de usuário normaliza e-mail', () => {
  const result = createUsuarioSchema.parse({
    nome: 'Maria Silva',
    email: '  MARIA@EXAMPLE.COM ',
    senha: 'senha-segura',
    telefone: '11999999999',
    foto_perfil: '',
  });
  assert.equal(result.email, 'maria@example.com');
  assert.equal(result.tipo, 'CLIENTE');
});

test('schema de usuário aceita CPF e tipo da conta', () => {
  const result = createUsuarioSchema.parse({
    nome: 'Maria Silva',
    email: 'maria@example.com',
    senha: 'senha-segura',
    telefone: '11999999999',
    foto_perfil: '',
    cpf: '52998224725',
    tipo: 'DIARISTA',
  });
  assert.equal(result.cpf, '52998224725');
  assert.equal(result.tipo, 'DIARISTA');
});

test('schema de usuário rejeita CPF com dígitos verificadores inválidos', () => {
  const result = createUsuarioSchema.safeParse({
    nome: 'Maria Silva',
    email: 'maria@example.com',
    senha: 'senha-segura',
    telefone: '11999999999',
    cpf: '12345678901',
  });
  assert.equal(result.success, false);
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

test('cadastros de cliente e diarista exigem endereço', () => {
  const cliente = {
    id_usuario: 1,
    data_nascimento: '1990-01-01',
    qtd_comodos: 5,
    tamanho_casa: 'media',
  };
  const diarista = {
    id_usuario: 2,
    descricao: 'Descrição profissional com tamanho válido.',
    qtd_max_comodos: 8,
  };
  assert.equal(createClienteSchema.safeParse(cliente).success, false);
  assert.equal(createClienteSchema.safeParse({ ...cliente, endereco: enderecoCadastro }).success, true);
  assert.equal(createDiaristaSchema.safeParse(diarista).success, false);
  assert.equal(createDiaristaSchema.safeParse({ ...diarista, endereco: enderecoCadastro }).success, true);
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

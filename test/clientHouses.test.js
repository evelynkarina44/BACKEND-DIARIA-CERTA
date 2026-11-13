import test from 'node:test';
import assert from 'node:assert/strict';
import { createEnderecoSchema, updateEnderecoSchema, createAgendamentoSchema } from '../src/schemas/apiSchemas.js';
import { CreateEnderecoService } from '../src/services/endereco/CreateEnderecoService.js';
import { UpdateEnderecoService } from '../src/services/endereco/UpdateEnderecoService.js';
import { assertEnderecoOwner } from '../src/services/endereco/EnderecoPolicy.js';
import { CreateClienteService } from '../src/services/cliente/CreateClienteService.js';
import { AgendamentoWorkflowService } from '../src/services/agendamento/AgendamentoWorkflowService.js';
import { ChatbotBookingService } from '../src/services/chatbot/ChatbotBookingService.js';
import { mergeRequestState } from '../src/services/chatbot/requestState.js';

const auth = { id_usuario: 1, id_cliente: 2, id_diarista: null };
const house = { id_cliente: 2, apelido: 'Casa 2', qtd_comodos: 8, tamanho_casa: 'grande', bairro: 'Centro', cep: '01001-000', logradouro: 'Rua Teste', numero: 2, cidade: 'São Paulo', estado: 'SP' };

test('cada casa exige nome, quantidade positiva de cômodos e tamanho válido', () => {
  assert.equal(createEnderecoSchema.safeParse(house).success, true);
  for (const field of ['apelido', 'qtd_comodos', 'tamanho_casa']) {
    const data = { ...house }; delete data[field];
    assert.equal(createEnderecoSchema.safeParse(data).success, false);
  }
  for (const changes of [{ qtd_comodos: 0 }, { qtd_comodos: 101 }, { tamanho_casa: 'gigante' }, { apelido: '' }]) {
    assert.equal(createEnderecoSchema.safeParse({ ...house, ...changes }).success, false);
    assert.equal(updateEnderecoSchema.safeParse(changes).success, false);
  }
});

test('cliente cadastra várias casas independentes e altera somente a selecionada', async () => {
  const records = [];
  const repository = {
    create: async data => { const record = { ...data, id_endereco: records.length + 1 }; records.push(record); return record; },
    findById: async id => records.find(item => item.id_endereco === id),
    update: async (id, data) => Object.assign(records.find(item => item.id_endereco === id), data),
  };
  const create = new CreateEnderecoService(repository);
  await create.execute({ ...house, apelido: 'Casa 1', qtd_comodos: 3, tamanho_casa: 'pequena' }, auth);
  await create.execute(house, auth);
  await new UpdateEnderecoService(repository).execute(2, { qtd_comodos: 9 }, auth);
  assert.equal(records[0].qtd_comodos, 3);
  assert.equal(records[1].qtd_comodos, 9);
  await assert.rejects(() => new UpdateEnderecoService(repository).execute(2, { apelido: 'Invadida' }, { id_cliente: 7, id_diarista: null }), /outro usuário/);
  assert.throws(() => assertEnderecoOwner({ id_cliente: 7, id_diarista: null }, auth), /outro usuário/);
});

test('primeiro endereço do cadastro recebe os cômodos e tamanho da residência sem quebrar clientes antigos', async () => {
  let saved;
  const tx = {
    cliente: { create: async args => { saved = args.data; return args.data; }, findUnique: async () => ({ id_cliente: 2 }) },
    diarista: { findUnique: async () => null }, usuario: { update: async () => ({}) },
  };
  const database = { $transaction: fn => fn(tx) };
  await new CreateClienteService({ findByIdUsuario: async () => null }, database).execute({ id_usuario: 1, qtd_comodos: 4, tamanho_casa: 'media', endereco: { cep: '01001-000' } }, auth);
  assert.equal(saved.endereco.create.apelido, 'Casa 1');
  assert.equal(saved.endereco.create.qtd_comodos, 4);
  assert.equal(saved.endereco.create.tamanho_casa, 'media');
});

function bookingScenario() {
  const data = createAgendamentoSchema.parse({ id_diarista: 8, id_endereco: 22, data_agendamento: '2099-01-01', horario_inicio: '09:00', horario_fim: '10:00', qtd_comodos: 1, tamanho_residencia: 'pequena', servicos: [{ id_diarista_servico: 3 }] });
  let stored;
  const database = {
    diarista: { findUnique: async () => ({ id_usuario: 12, usuario: { ativo: true, bloqueado: false }, combo_base: [] }) },
    endereco: { findUnique: async () => ({ ...house, id_endereco: 22 }) },
    diarista_servico: { findMany: async () => [{ id_diarista_servico: 3, id_diarista: 8, id_servico: 4, ativo: true, preco: 100 }] },
    disponibilidade_diarista: { findMany: async () => [{ horario_inicio: data.horario_inicio, horario_fim: data.horario_fim }] },
    agendamento: { findMany: async () => [], create: async ({ data }) => { stored = data; return { ...data, id_agendamento: 44, status: 'Pendente', agendamento_servico: [] }; } },
  };
  return { data, database, get stored() { return stored; } };
}

test('agendamento usa e persiste a casa escolhida, ignorando tamanho e cômodos adulterados no formulário', async () => {
  const scenario = bookingScenario();
  const service = new AgendamentoWorkflowService(scenario.database);
  const pricing = await service.validateAndPrice(scenario.data, auth);
  assert.equal(pricing.qtd_comodos, 8);
  assert.equal(pricing.tamanho_residencia, 'grande');
  await service.create(scenario.data, auth, true);
  assert.equal(scenario.stored.id_endereco, 22);
  assert.equal(scenario.stored.qtd_comodos, 8);
  assert.equal(scenario.stored.tamanho_residencia, 'grande');
  scenario.database.endereco.findUnique = async () => ({ ...house, id_cliente: 999 });
  await assert.rejects(() => service.estimate(scenario.data, auth), /não pertence/);
});

test('compatibilidade do combo é validada pelo tamanho cadastrado na casa selecionada', async () => {
  const { data, database } = bookingScenario();
  const combo = { id_combo_base: 9, valor_base: 80, atende_casa_pequena: true, atende_casa_grande: false, combo_servico: [{ id_servico: 4 }] };
  database.diarista.findUnique = async () => ({ id_usuario: 12, usuario: { ativo: true, bloqueado: false }, combo_base: [combo] });
  await assert.rejects(() => new AgendamentoWorkflowService(database).estimate({ ...data, id_combo_base: 9 }, auth), /tamanho da residência/);
});

test('chatbot pede casa com várias opções antes de buscar profissional, sem escolher a primeira', async () => {
  const database = { cliente: { findUnique: async () => ({ qtd_comodos: 1, tamanho_casa: 'pequena', endereco: [{ ...house, id_endereco: 21, apelido: 'Casa 1' }, { ...house, id_endereco: 22 }] }) } };
  const service = new ChatbotBookingService(database);
  const result = await service.propose({ data: '2099-01-01', horario: '09:00', servicos: [4] }, auth, [{ id_servico: 4, nome_servico: 'Limpar' }]);
  assert.equal(result.opcoes.length, 2);
  assert.match(result.opcoes[0].label, /Casa 1/);
  assert.match(result.opcoes[1].label, /Casa 2/);
  assert.equal(result.proposal, undefined);
  const date = new Date('2099-01-01T00:00:00Z'), start = new Date('1970-01-01T09:00:00Z');
  const profile = { id_diarista: 8, combo_base: [], diarista_servico: [{ id_servico: 4, id_diarista_servico: 3 }], disponibilidade_diarista: [{ dia_semana: date, horario_inicio: start, horario_fim: new Date('1970-01-01T10:00:00Z') }] };
  const payload = service.candidatePayload(profile, { data: '2099-01-01', horario: '09:00', servicos: [4] }, { qtd_comodos: 1, tamanho_casa: 'pequena' }, { ...house, id_endereco: 22 }, date, start);
  assert.equal(payload.id_endereco, 22);
  assert.equal(payload.qtd_comodos, 8);
  assert.equal(payload.tamanho_residencia, 'grande');
});

test('trocar a casa no chatbot descarta combo anterior, sem perder os serviços desejados', () => {
  const state = mergeRequestState({ id_endereco: 1, id_combo_base: 9, servicos: [4] }, {}, { id_endereco: 22 });
  assert.equal(state.id_endereco, 22);
  assert.equal(state.id_combo_base, undefined);
  assert.deepEqual(state.servicos, [4]);
});

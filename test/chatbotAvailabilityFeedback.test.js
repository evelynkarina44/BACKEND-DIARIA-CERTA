import test from 'node:test';
import assert from 'node:assert/strict';
import { ChatbotBookingService } from '../src/services/chatbot/ChatbotBookingService.js';

const day = new Date(); day.setUTCDate(day.getUTCDate() + 7); day.setUTCHours(0, 0, 0, 0);
const state = { data: day.toISOString().slice(0, 10), horario: '08:00', servicos: [28] };
const catalog = [{ id_servico: 28, nome_servico: 'Limpeza teste' }];
const auth = { id_usuario: 7, id_cliente: 3, activeProfile: 'CLIENTE' };
const slot = (start, end) => ({ dia_semana: day, horario_inicio: new Date(`1970-01-01T${start}:00Z`), horario_fim: new Date(`1970-01-01T${end}:00Z`) });
const profile = (slots = [], bookings = []) => ({ qtd_max_comodos: 6, endereco: [{ cep: '01001-000' }], disponibilidade_diarista: slots, agendamento: bookings });

function serviceFor(profiles, ownProfile = null) {
  const database = { diarista: { findMany: async () => profiles, findUnique: async () => ownProfile } };
  return new ChatbotBookingService(database);
}

test('explica ausência de agenda de outras profissionais e impede contratação da mesma conta', async () => {
  const own = { diarista_servico: [{ id_servico: 28 }], disponibilidade_diarista: [slot('08:30', '09:30')] };
  const outcome = await serviceFor([profile()], own).explainNoAvailability({ ...state, horario: '08:30' }, auth, catalog);
  assert.match(outcome.texto, /Não encontrei horários futuros cadastrados/);
  assert.match(outcome.texto, /próprio perfil de diarista/);
  assert.match(outcome.texto, /não é permitido contratar a mesma conta/);
  assert.equal(outcome.proposal, undefined);
});

test('não atribui ausência de agenda a falha de localização', async () => {
  const outcome = await serviceFor([profile()]).explainNoAvailability(state, auth, catalog);
  assert.match(outcome.texto, /Limpeza teste/);
  assert.doesNotMatch(outcome.texto, /localização/);
  assert.doesNotMatch(outcome.texto, /cômodos/);
});

test('sugere somente horários cadastrados livres, mantendo o horário solicitado', async () => {
  const registered = [slot('08:30', '09:30'), slot('10:00', '11:00')];
  const booked = [{ data_agendamento: day, ...slot('10:00', '11:00') }];
  const outcome = await serviceFor([profile(registered, booked)]).explainNoAvailability(state, auth, catalog);
  assert.match(outcome.texto, /às 08:30/);
  assert.doesNotMatch(outcome.texto, /às 10:00/);
  assert.match(outcome.texto, /prefere que eu verifique/);
  assert.equal(state.horario, '08:00');
  assert.equal(outcome.proposal, undefined);
});

test('explica horários ocupados sem bloquear pela quantidade de cômodos', async () => {
  const booked = [{ data_agendamento: day, ...slot('08:30', '09:30') }];
  const busy = await serviceFor([profile([slot('08:30', '09:30')], booked)]).explainNoAvailability(state, auth, catalog);
  assert.match(busy.texto, /ocupados por agendamentos aceitos/);
  const smallHouse = { ...profile([slot('08:30', '09:30')]), qtd_max_comodos: 4 };
  const alternative = await serviceFor([smallHouse]).explainNoAvailability(state, auth, catalog);
  assert.match(alternative.texto, /às 08:30/);
  assert.doesNotMatch(alternative.texto, /cômodos/);
});

test('diferencia profissionais sem endereço de horário não cadastrado', async () => {
  const noAddress = { ...profile([slot('08:30', '09:30')]), endereco: [] };
  const outcome = await serviceFor([noAddress]).explainNoAvailability(state, auth, catalog);
  assert.match(outcome.texto, /sem endereço informado/);
  assert.equal(outcome.proposal, undefined);
});

test('erro de coordenadas não é apresentado como ausência de serviços ou agenda', async () => {
  const selectedSlot = slot('08:00', '09:00');
  const professional = { ...profile([selectedSlot]), id_diarista: 10 };
  const database = {
    cliente: { findUnique: async () => ({ qtd_comodos: 5, tamanho_casa: 'media', endereco: [{ id_endereco: 1, cep: '01001-000' }] }) },
    diarista: { findMany: async () => [professional] },
  };
  let calls = 0;
  const booking = new ChatbotBookingService(database, async () => ++calls === 1 ? { latitude: -23.55, longitude: -46.63 } : null);
  const outcome = await booking.propose(state, auth, catalog);
  assert.match(outcome.texto, /Encontrei profissionais com os serviços e o horário/);
  assert.match(outcome.texto, /localização dos CEPs/);
  assert.equal(outcome.proposal, undefined);
});

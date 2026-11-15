import test from 'node:test';
import assert from 'node:assert/strict';
import { AppointmentLocationService } from '../src/services/agendamento/AppointmentLocationService.js';
import { AgendamentoWorkflowService } from '../src/services/agendamento/AgendamentoWorkflowService.js';

function fixture() {
  const calls = [], origin = { latitude: -23.55, longitude: -46.63 }, destination = { latitude: -23.56, longitude: -46.64 };
  const appointment = { id_agendamento: 4, id_diarista: 8, endereco: { cep: '22222222' }, valor_estimado: 100 };
  const database = {
    endereco: { findFirst: async ({ where }) => { assert.equal(where.id_diarista, 8); return { cep: '11111111' }; } },
    agendamento: { findUnique: async () => appointment, findMany: async () => [appointment], count: async () => 1, updateMany: async () => ({count:0}) },
  };
  const geocode = async cep => { calls.push(cep); return cep === '11111111' ? origin : destination; };
  return { service: new AppointmentLocationService(database, geocode), database, appointment, calls, geocode };
}

test('distância usa endereço da diarista e a casa escolhida no agendamento', async () => {
  const f = fixture();
  const result = await f.service.find(4, { id_diarista: 8, activeProfile: 'DIARISTA' });
  assert.deepEqual(f.calls, ['11111111', '22222222']);
  assert.ok(result.distancia_km > 1 && result.distancia_km < 2);
  assert.equal(result.precisao, 'cep');
  assert.deepEqual(result.ponto_destino, { latitude: -23.56, longitude: -46.64 });
});

test('localização exige perfil ativo e participação; não geocodifica para outra diarista', async () => {
  const f = fixture();
  for (const auth of [{}, { id_diarista: 8, activeProfile: 'CLIENTE' }, { id_diarista: 9, activeProfile: 'DIARISTA' }]) {
    await assert.rejects(() => f.service.find(4, auth), error => error.statusCode === 403);
  }
  assert.equal(f.calls.length, 0);
  f.database.agendamento.findUnique = async () => null;
  await assert.rejects(() => f.service.find(4, { id_diarista: 8, activeProfile: 'DIARISTA' }), error => error.statusCode === 404);
});

test('falha de CEP não inventa zero quilômetros nem impede consulta da diária', async () => {
  const f = fixture();
  const failing = new AppointmentLocationService(f.database, async () => { throw Error('offline'); });
  const result = await failing.find(4, { id_diarista: 8, activeProfile: 'DIARISTA' });
  assert.equal(result.distancia_km, null);
  assert.equal(result.ponto_destino, null);
});

test('listagem de solicitações inclui quilômetros; demais visões não consultam geocodificação', async () => {
  const f = fixture(), service = new AgendamentoWorkflowService(f.database, f.geocode);
  const auth = { id_diarista: 8, activeProfile: 'DIARISTA' };
  const response = await service.list({visao:'solicitacoes'}, auth);
  assert.equal(response.data[0].id_agendamento, 4);
  assert.ok(response.data[0].distancia_km > 1);
  assert.equal('ponto_destino' in response.data[0], false);
  f.calls.length = 0;
  await service.list({visao:'historico'}, auth);
  assert.equal(f.calls.length, 0);
});

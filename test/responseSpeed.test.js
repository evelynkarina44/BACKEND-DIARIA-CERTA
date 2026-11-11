import test from 'node:test';
import assert from 'node:assert/strict';
import { respondsQuickly } from '../src/services/diarista/responseSpeedPolicy.js';
import { DiaristaSearchService } from '../src/services/diarista/DiaristaSearchService.js';
import { ListFavoritoService } from '../src/services/favorito/ListFavoritoService.js';
import { diaristaSearchSchema } from '../src/schemas/apiSchemas.js';

const now = new Date('2026-11-11T12:00:00Z');
const request = (hours, status = 'Aceito') => ({ status, solicitado_em: new Date('2020-01-01T00:00:00Z'), respondido_em: new Date(new Date('2020-01-01T00:00:00Z').getTime() + hours * 3600000) });

test('selo exige ao menos uma resposta e TODAS em até 24 horas, não uma média', () => {
  assert.equal(respondsQuickly([], now), false);
  assert.equal(respondsQuickly([request(1), request(24, 'Recusado')], now), true);
  assert.equal(respondsQuickly([request(1), request(25)], now), false);
  assert.equal(respondsQuickly([request(24 + 1 / 3600000)], now), false);
  for (const status of ['Aceito', 'Recusado', 'Em_andamento', 'Concluido']) {
    assert.equal(respondsQuickly([request(24, status)], now), true);
    assert.equal(respondsQuickly([request(25, status)], now), false);
  }
});

test('pendências vencidas e expiração retiram o selo; cancelamentos não são respostas', () => {
  const pending = hours => ({ status: 'Pendente', solicitado_em: new Date(now.getTime() - hours * 3600000), respondido_em: null });
  assert.equal(respondsQuickly([pending(1)], now), false);
  assert.equal(respondsQuickly([request(1), pending(24)], now), true);
  assert.equal(respondsQuickly([request(1), pending(24.001)], now), false);
  assert.equal(respondsQuickly([request(1), request(48, 'Expirado')], now), false);
  assert.equal(respondsQuickly([request(1, 'Cancelado')], now), false);
  assert.equal(respondsQuickly([request(1), request(60, 'Cancelado')], now), true);
});

test('datas ausentes, inválidas, invertidas ou no futuro nunca concedem o selo', () => {
  for (const changes of [{ respondido_em: null }, { solicitado_em: null }, { respondido_em: 'invalido' }, { respondido_em: new Date('2019-01-01') }, { respondido_em: new Date('2099-01-01') }]) {
    assert.equal(respondsQuickly([{ ...request(1), ...changes }], now), false);
  }
});

function profile(id, history) {
  return { id_diarista: id, usuario: { nome: String(id) }, frequencia_resposta: 'Responde rápido', avaliacao_media: null, endereco: [], diarista_servico: [], combo_base: [], avaliacao: [], agendamento: history };
}

test('busca calcula selo e filtra antes de paginar, sem expor histórico de agendamentos', async () => {
  const profiles = [profile(1, []), profile(2, [request(24)]), profile(3, [request(25)]), profile(4, [request(1, 'Recusado')])];
  const calls = [];
  const service = new DiaristaSearchService({
    diarista: { findMany: async args => { calls.push(args); return profiles; }, findUnique: async () => profiles[1] },
    servico: { findMany: async () => [] },
  });
  const result = await service.list({ responde_rapido: true, page: 2, limit: 1, ordenar: 'nome' });
  assert.deepEqual(result.pagination, { page: 2, limit: 1, total: 2, pages: 2 });
  assert.equal(result.data[0].id_diarista, 4);
  assert.equal(result.data[0].responde_rapido, true);
  assert.equal(result.data[0].agendamento, undefined);
  assert.deepEqual(Object.keys(calls[0].include.agendamento.select).sort(), ['respondido_em', 'solicitado_em', 'status']);
  const all = await service.list({ responde_rapido: false, ordenar: 'nome' });
  assert.deepEqual(all.data.map(item => item.responde_rapido), [false, true, false, true]);
  assert.equal((await service.find(2)).responde_rapido, true);
});

test('favoritos usam a mesma regra sem divulgar os pedidos da diarista', async () => {
  const service = new ListFavoritoService({
    findAll: async () => [1, 25].map((hours, index) => ({ id_favorito: index + 1, diarista: profile(index + 1, [request(hours)]) })),
    count: async () => 2,
  });
  const result = await service.execute({}, { id_cliente: 2 });
  assert.deepEqual(result.data.map(item => item.diarista.responde_rapido), [true, false]);
  assert.equal(result.data[0].diarista.agendamento, undefined);
});

test('query booleana não confunde false com true', () => {
  assert.equal(diaristaSearchSchema.parse({ responde_rapido: 'true' }).responde_rapido, true);
  assert.equal(diaristaSearchSchema.parse({ responde_rapido: 'false' }).responde_rapido, false);
  assert.equal(diaristaSearchSchema.parse({ responde_rapido: true }).responde_rapido, true);
  assert.equal(diaristaSearchSchema.parse({}).responde_rapido, undefined);
  assert.equal(diaristaSearchSchema.safeParse({ responde_rapido: 'qualquer' }).success, false);
});

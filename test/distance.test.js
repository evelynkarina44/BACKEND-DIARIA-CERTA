import test from 'node:test';
import assert from 'node:assert/strict';
import { calculateDistanceKm } from '../src/services/location/CepGeocodingService.js';
import { diaristaSearchSchema } from '../src/schemas/apiSchemas.js';

test('calcula zero para coordenadas iguais', () => {
  const point = { latitude: -23.5505, longitude: -46.6333 };
  assert.equal(calculateDistanceKm(point, point), 0);
});

test('calcula distância geográfica em quilômetros', () => {
  const saoPaulo = { latitude: -23.5505, longitude: -46.6333 };
  const jundiai = { latitude: -23.1857, longitude: -46.8978 };
  const distance = calculateDistanceKm(saoPaulo, jundiai);
  assert.ok(distance > 45 && distance < 55);
});

test('busca por distância aceita CEP de origem e limite', () => {
  const result = diaristaSearchSchema.parse({ cep_origem: '13201-000', distancia_max: '10', ordenar: 'distancia' });
  assert.equal(result.distancia_max, 10);
  assert.equal(result.ordenar, 'distancia');
});

test('busca por distância exige CEP de origem', () => {
  assert.equal(diaristaSearchSchema.safeParse({ distancia_max: 10, ordenar: 'distancia' }).success, false);
});

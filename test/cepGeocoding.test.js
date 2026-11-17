import test from 'node:test';
import assert from 'node:assert/strict';
import { createCepGeocoder } from '../src/services/location/CepGeocodingService.js';

const response = data => ({ ok: true, json: async () => data });
test('CEP uses alternate provider when primary has no coordinates and caches success', async () => {
  const calls = [];
  const geocode = createCepGeocoder({ fetcher: async url => {
    calls.push(url);
    return response(url.includes('brasilapi') ? { location: { coordinates: {} } } : { cep: '06626030', lat: '-23.55', lng: '-46.63' });
  } });
  assert.deepEqual(await geocode('06626-030'), { latitude: -23.55, longitude: -46.63 });
  await geocode('06626030');
  assert.equal(calls.length, 2);
});

test('temporary failures expire after 30 seconds instead of being cached all day', async () => {
  let time = 0, online = false, calls = 0;
  const geocode = createCepGeocoder({ now: () => time, fetcher: async () => {
    calls++;
    if (!online) throw new Error('offline');
    return response({ location: { coordinates: { latitude: -23, longitude: -46 } } });
  } });
  assert.equal(await geocode('06626030'), null);
  online = true;
  assert.equal(await geocode('06626030'), null);
  assert.equal(calls, 2);
  time = 30001;
  assert.deepEqual(await geocode('06626030'), { latitude: -23, longitude: -46 });
});

test('rejects mismatched CEPs and invalid coordinates; invalid inputs make no request', async () => {
  let calls = 0;
  const geocode = createCepGeocoder({ fetcher: async url => {
    calls++;
    return response(url.includes('brasilapi')
      ? { cep: '01001000', location: { coordinates: { latitude: -23, longitude: -46 } } }
      : { lat: '', lng: '999' });
  } });
  assert.equal(await geocode('123'), null);
  assert.equal(calls, 0);
  assert.equal(await geocode('06626030'), null);
  assert.equal(calls, 2);
});

test('deduplicates concurrent requests for the same normalized CEP', async () => {
  let calls = 0;
  const geocode = createCepGeocoder({ fetcher: async () => {
    calls++;
    return response({ location: { coordinates: { latitude: -23, longitude: -46 } } });
  } });
  const results = await Promise.all([geocode('06626-030'), geocode('06626030')]);
  assert.deepEqual(results[0], results[1]);
  assert.equal(calls, 1);
});

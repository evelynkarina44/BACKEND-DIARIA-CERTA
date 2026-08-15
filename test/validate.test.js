import test from 'node:test';
import assert from 'node:assert/strict';
import { z } from 'zod';
import { validate } from '../src/middlewares/validate.js';

test('validate substitui query somente leitura no Express 5', () => {
  const req = {};
  Object.defineProperty(req, 'query', {
    configurable: true,
    get: () => ({ page: '2' }),
  });
  const middleware = validate(z.object({ page: z.coerce.number().int() }), 'query');
  let receivedError;

  middleware(req, {}, (error) => { receivedError = error; });

  assert.equal(receivedError, undefined);
  assert.deepEqual(req.query, { page: 2 });
});

import test from 'node:test';
import assert from 'node:assert/strict';
import { createHmac } from 'node:crypto';
import { cents, splitPayment, assertPayable, installmentStatus } from '../src/services/pagamento/paymentPolicy.js';
import { verifyWebhook } from '../src/services/pagamento/verifyWebhook.js';
import { MercadoPagoClient, paymentConfig } from '../src/services/pagamento/MercadoPagoClient.js';
import { PaymentService } from '../src/services/pagamento/PaymentService.js';
import { CheckinCheckoutWorkflowService } from '../src/services/checkinCheckout/CheckinCheckoutWorkflowService.js';

test('dinheiro é dividido em centavos sem perder nem duplicar o centavo ímpar', () => {
  assert.equal(cents('99.99'), 9999);
  assert.deepEqual(splitPayment('99.99'), { entrada: 4999, saldo: 5000 });
  assert.deepEqual(splitPayment(100), { entrada: 5000, saldo: 5000 });
  for (const invalid of [null, undefined, '', '1,00', -1, 1.001, Infinity]) assert.throws(() => splitPayment(invalid));
  assert.throws(() => splitPayment('0.01'));
});

test('entrada só após aceite; saldo só após conclusão com checkout real', () => {
  for (const status of ['Pendente', 'Recusado', 'Expirado', 'Cancelado', 'Em_andamento', 'Concluido']) {
    assert.throws(() => assertPayable({ status }, 'Entrada'));
  }
  assert.doesNotThrow(() => assertPayable({ status: 'Aceito' }, 'Entrada'));
  assert.throws(() => assertPayable({ status: 'Em_andamento' }, 'Saldo'));
  assert.throws(() => assertPayable({ status: 'Concluido', checkin_checkout: [] }, 'Saldo'));
  assert.doesNotThrow(() => assertPayable({ status: 'Concluido', checkin_checkout: [{ horario_checkout: new Date() }] }, 'Saldo'));
});

test('aprovação, duplicidade, estorno e contestação não se confundem com pagamento pendente', () => {
  const approved = { status: 'approved', valor_centavos: 5000, estornado_centavos: 0, estorno_pendente: false };
  assert.equal(installmentStatus([approved], 5000), 'Pago');
  assert.equal(installmentStatus([{ ...approved, estorno_pendente: true }], 5000), 'Estorno_pendente');
  assert.equal(installmentStatus([{ ...approved, status: 'refunded', estornado_centavos: 5000 }], 5000), 'Estornado');
  assert.equal(installmentStatus([{ ...approved, status: 'charged_back' }], 5000), 'Em_disputa');
  assert.equal(installmentStatus([{ ...approved, status: 'pending' }], 5000), 'Pendente');
  assert.equal(installmentStatus([{ ...approved, status: 'rejected' }], 5000), 'Falhou');
});

test('webhook exige assinatura HMAC válida vinculada ao ID da URL e ao request-id', () => {
  const data = { paymentId: '123', requestId: 'request-test', signature: '' };
  const digest = createHmac('sha256', 'segredo-de-teste').update('id:123;request-id:request-test;ts:123456;').digest('hex');
  data.signature = `ts=123456,v1=${digest}`;
  assert.doesNotThrow(() => verifyWebhook(data, 'segredo-de-teste'));
  assert.throws(() => verifyWebhook({ ...data, paymentId: '456' }, 'segredo-de-teste'));
  assert.throws(() => verifyWebhook({ ...data, requestId: 'outro' }, 'segredo-de-teste'));
  assert.throws(() => verifyWebhook({ ...data, signature: 'ts=1,v1=abc' }, 'segredo-de-teste'));
  assert.throws(() => verifyWebhook(data, ''));
});

test('configuração não libera pagamento sem habilitação explícita, credenciais e HTTPS', () => {
  const env = { MERCADOPAGO_ENABLED: 'true', MERCADOPAGO_MODE: 'test', MERCADOPAGO_ACCESS_TOKEN: 'token-falso', MERCADOPAGO_COLLECTOR_ID: '123', MERCADOPAGO_WEBHOOK_SECRET: 'segredo-falso', MERCADOPAGO_WEBHOOK_URL: 'https://api.example.com/api/pagamento/webhook', MERCADOPAGO_RETURN_URL: 'https://app.example.com' };
  assert.equal(paymentConfig(env).production, false);
  for (const field of ['MERCADOPAGO_ENABLED', 'MERCADOPAGO_ACCESS_TOKEN', 'MERCADOPAGO_COLLECTOR_ID', 'MERCADOPAGO_WEBHOOK_SECRET', 'MERCADOPAGO_MODE']) {
    assert.throws(() => paymentConfig({ ...env, [field]: '' }));
  }
  assert.throws(() => paymentConfig({ ...env, MERCADOPAGO_WEBHOOK_URL: 'http://localhost:3000' }));
});

test('cliente HTTP usa o domínio fixo, timeout, credencial só no header e chave estável no estorno', async () => {
  const calls = [];
  const client = new MercadoPagoClient({
    config: () => ({ accessToken: 'token-apenas-de-teste', production: true }),
    fetcher: async (url, options) => { calls.push({ url, options }); return { ok: true, json: async () => ({ status: 'approved' }) }; },
  });
  await client.refund('123'); await client.refund('123');
  assert.equal(calls[0].url, 'https://api.mercadopago.com/v1/payments/123/refunds');
  assert.equal(calls[0].options.headers.Authorization, 'Bearer token-apenas-de-teste');
  assert.equal(calls[0].options.headers['X-Idempotency-Key'], calls[1].options.headers['X-Idempotency-Key']);
  assert.ok(calls[0].options.signal);
  const broken = new MercadoPagoClient({ config: () => ({ accessToken: 'nao-vazar' }), fetcher: async () => { throw new Error('nao-vazar'); } });
  await assert.rejects(() => broken.getPayment('1'), (error) => error.statusCode === 502 && !error.message.includes('nao-vazar'));
});

test('teste local permite consultar pela API sem URLs públicas, mas nunca pode funcionar em produção', () => {
  const env = { MERCADOPAGO_ENABLED: 'true', MERCADOPAGO_MODE: 'test', MERCADOPAGO_LOCAL_TEST: 'true', MERCADOPAGO_ACCESS_TOKEN: 'token-falso', MERCADOPAGO_COLLECTOR_ID: '123' };
  const config = paymentConfig(env);
  assert.equal(config.localTest, true);
  assert.equal(config.notificationUrl, null);
  assert.equal(config.returnUrl, null);
  assert.throws(() => paymentConfig({ ...env, MERCADOPAGO_MODE: 'production' }));
  assert.throws(() => paymentConfig({ ...env, NODE_ENV: 'production' }));
  assert.throws(() => paymentConfig({ ...env, MERCADOPAGO_WEBHOOK_URL: 'https://api.example.com/webhook' }));
});

test('modo teste verifica conta vendedora real na API antes de criar checkout e mantém cache por credencial', async () => {
  const paths = [];
  let token = 'token-falso';
  const client = new MercadoPagoClient({
    config: () => ({ accessToken: token, collectorId: '123', production: false }),
    fetcher: async (url) => {
      paths.push(new URL(url).pathname);
      return { ok: true, json: async () => url.endsWith('/users/me') ? { id: 123, tags: ['test_user'] } : { id: 'pref-teste' } };
    },
  });
  await client.createPreference({}); await client.createPreference({});
  assert.deepEqual(paths, ['/users/me', '/checkout/preferences', '/checkout/preferences']);
  token = 'outra-credencial-falsa';
  await client.createPreference({});
  assert.equal(paths.filter((path) => path === '/users/me').length, 2);
});

test('modo teste rejeita conta real e recebedor divergente antes de criar cobrança ou estorno', async () => {
  for (const account of [{ id: 123, tags: [] }, { id: 999, tags: ['test_user'] }]) {
    const client = new MercadoPagoClient({
      config: () => ({ accessToken: 'token-falso', collectorId: '123', production: false }),
      fetcher: async (url) => {
        assert.equal(new URL(url).pathname, '/users/me');
        return { ok: true, json: async () => account };
      },
    });
    await assert.rejects(() => client.createPreference({}), /conta de teste/);
    await assert.rejects(() => client.refund('123'), /conta de teste/);
  }
});

test('somente participantes consultam pagamentos e somente o cliente inicia cobrança', async () => {
  const appointment = { id_agendamento: 1, id_cliente: 2, id_diarista: 3, valor_estimado: 100, status: 'Aceito', pagamento_parcela: [], checkin_checkout: [] };
  const service = new PaymentService({ agendamento: { findUnique: async () => appointment } });
  await assert.rejects(() => service.get(1, { id_cliente: 99 }), (error) => error.statusCode === 403);
  await assert.rejects(() => service.checkout(1, 'Entrada', { id_diarista: 3, activeProfile: 'DIARISTA' }), (error) => error.statusCode === 403);
  const result = await service.get(1, { id_cliente: 2 });
  assert.deepEqual(result.parcelas.map((item) => item.valor), [50, 50]);
  assert.equal(result.parcelas[0].pode_pagar, true);
  assert.equal(result.parcelas[1].pode_pagar, false);
});

test('live_mode=true no teste só é aceito com conta test_user revalidada, sem liberar produção indevida', async () => {
  const provider = {};
  const service = new PaymentService({}, provider);
  await assert.doesNotReject(() => service.validatePaymentEnvironment({ live_mode: false }, { production: false }));
  await assert.doesNotReject(() => service.validatePaymentEnvironment({ live_mode: true }, { production: true }));
  await assert.rejects(() => service.validatePaymentEnvironment({ live_mode: true }, { production: false }), /não corresponde/);
  let checked = 0;
  provider.assertTestAccount = async () => { checked++; };
  await service.validatePaymentEnvironment({ live_mode: true }, { production: false });
  assert.equal(checked, 1);
  await assert.rejects(() => service.validatePaymentEnvironment({ live_mode: 'true' }, { production: false }), /não corresponde/);
  await assert.rejects(() => service.validatePaymentEnvironment({ live_mode: false }, { production: true }), /não corresponde/);
  provider.assertTestAccount = async () => { throw new Error('A conta recebedora não é de teste'); };
  await assert.rejects(() => service.validatePaymentEnvironment({ live_mode: true }, { production: false }), /não é de teste/);
});

test('endpoint legado de confirmar pagamento não transforma clique em aprovação financeira', async () => {
  const appointment = { id_agendamento: 1, id_cliente: 2, id_diarista: 3, status: 'Aceito', pagamento_parcela: [], checkin_checkout: [{ id_check: 1, status_checkin: 'Checkin_solicitado' }] };
  const database = {
    $queryRaw: async () => [], agendamento: { findUnique: async () => appointment },
    checkin_checkout: { update: () => assert.fail('Não pode iniciar sem pagamento real') },
  };
  database.$transaction = async (callback) => callback(database);
  await assert.rejects(() => new CheckinCheckoutWorkflowService(database).confirmPayment(1, { id_cliente: 2 }), /ainda não foi aprovada/);
});

import { ExternalServiceError, ServiceUnavailableError } from '../../errors/index.js';
import { createHash } from 'node:crypto';

function httpsUrl(value, name) {
  try {
    const url = new URL(value);
    if (url.protocol !== 'https:' || url.username || url.password || ['localhost', '127.0.0.1'].includes(url.hostname)) throw new Error();
    return url.toString();
  } catch {
    throw new ServiceUnavailableError(`Configure ${name} com uma URL HTTPS pública.`);
  }
}

export function paymentConfig(env = process.env) {
  if (env.MERCADOPAGO_ENABLED !== 'true') throw new ServiceUnavailableError('Pagamento online ainda não está habilitado.');
  if (!env.MERCADOPAGO_ACCESS_TOKEN || !/^\d+$/.test(env.MERCADOPAGO_COLLECTOR_ID || '')) {
    throw new ServiceUnavailableError('Configure o Access Token e a conta recebedora do Mercado Pago no backend.');
  }
  if (!['test', 'production'].includes(env.MERCADOPAGO_MODE)) throw new ServiceUnavailableError('Configure MERCADOPAGO_MODE como test ou production.');
  const production = env.MERCADOPAGO_MODE === 'production';
  const localTest = env.MERCADOPAGO_LOCAL_TEST === 'true';
  if (localTest && (production || env.NODE_ENV === 'production')) {
    throw new ServiceUnavailableError('Teste local de pagamento não pode ser habilitado em produção.');
  }
  const hasWebhook = Boolean(env.MERCADOPAGO_WEBHOOK_URL || env.MERCADOPAGO_WEBHOOK_SECRET);
  if ((!localTest || hasWebhook) && (!env.MERCADOPAGO_WEBHOOK_URL || !env.MERCADOPAGO_WEBHOOK_SECRET)) {
    throw new ServiceUnavailableError('Configure a URL e o segredo dos Webhooks do Mercado Pago.');
  }
  return {
    accessToken: env.MERCADOPAGO_ACCESS_TOKEN,
    webhookSecret: env.MERCADOPAGO_WEBHOOK_SECRET,
    collectorId: env.MERCADOPAGO_COLLECTOR_ID,
    production,
    localTest,
    notificationUrl: localTest && !hasWebhook ? null : httpsUrl(env.MERCADOPAGO_WEBHOOK_URL, 'MERCADOPAGO_WEBHOOK_URL'),
    returnUrl: localTest && !env.MERCADOPAGO_RETURN_URL ? null : httpsUrl(env.MERCADOPAGO_RETURN_URL, 'MERCADOPAGO_RETURN_URL'),
  };
}

export class MercadoPagoClient {
  constructor({ fetcher = globalThis.fetch, config = paymentConfig } = {}) {
    this.fetcher = fetcher;
    this.config = config;
  }

  async request(path, { method = 'GET', body, key } = {}) {
    const config = this.config();
    try {
      const response = await this.fetcher(`https://api.mercadopago.com${path}`, {
        method,
        headers: {
          Authorization: `Bearer ${config.accessToken}`,
          'Content-Type': 'application/json',
          ...(key ? { 'X-Idempotency-Key': key } : {}),
        },
        ...(body ? { body: JSON.stringify(body) } : {}),
        signal: AbortSignal.timeout(12000),
      });
      if (!response.ok) throw new Error('Resposta não aprovada');
      return await response.json();
    } catch {
      // Nunca enviar credenciais, corpo da API ou dados financeiros ao log/cliente.
      throw new ExternalServiceError('Não foi possível consultar o Mercado Pago. Tente novamente em instantes.');
    }
  }

  async assertTestAccount() {
    const config = this.config();
    if (config.production) return;
    const fingerprint = createHash('sha256').update(config.accessToken + ':' + config.collectorId).digest('hex');
    if (this.checkedAccount?.fingerprint === fingerprint && this.checkedAccount.until > Date.now()) return;
    const account = await this.request('/users/me');
    if (String(account.id) !== config.collectorId || !account.tags?.includes('test_user')) {
      throw new ServiceUnavailableError('O modo de teste exige credenciais de uma conta de teste vendedora do Mercado Pago.');
    }
    this.checkedAccount = { fingerprint, until: Date.now() + 5 * 60 * 1000 };
  }

  async createPreference(body) {
    await this.assertTestAccount();
    return this.request('/checkout/preferences', { method: 'POST', body });
  }
  getPayment(id) { return this.request(`/v1/payments/${encodeURIComponent(id)}`); }
  searchPayments(reference) {
    return this.request(`/v1/payments/search?external_reference=${encodeURIComponent(reference)}&sort=date_created&criteria=desc&limit=100`);
  }
  async refund(id) {
    await this.assertTestAccount();
    return this.request(`/v1/payments/${encodeURIComponent(id)}/refunds`, {
      method: 'POST', body: {}, key: `diaria-certa-refund-${id}`,
    });
  }
}

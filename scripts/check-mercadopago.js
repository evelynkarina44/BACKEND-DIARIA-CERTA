// Sem argumentos, consulta somente a conta. --checkout cria um link de teste,
// sem realizar pagamento, estorno ou alterar agendamentos.
import 'dotenv/config';
import { randomUUID } from 'node:crypto';
import { MercadoPagoClient, paymentConfig } from '../src/services/pagamento/MercadoPagoClient.js';

try {
  if (!process.env.MERCADOPAGO_ACCESS_TOKEN) throw new Error('Access Token não configurado.');
  const response = await fetch('https://api.mercadopago.com/users/me', {
    headers: { Authorization: `Bearer ${process.env.MERCADOPAGO_ACCESS_TOKEN}` },
    signal: AbortSignal.timeout(12000),
  });
  if (!response.ok) {
    console.log(JSON.stringify({ ok: false, http_status: response.status, mensagem: 'Não foi possível validar a credencial no Mercado Pago.' }));
    process.exitCode = 1;
  } else {
    const account = await response.json();
    console.log(JSON.stringify({ ok: true, collector_id: String(account.id), conta_de_teste: account.tags?.includes('test_user') === true, pais: account.site_id }));
    if (process.argv.includes('--checkout')) {
      const config = paymentConfig();
      if (config.production || !account.tags?.includes('test_user') || String(account.id) !== config.collectorId) {
        throw new Error('Verificação de checkout permitida apenas para a conta de teste configurada.');
      }
      const preference = await new MercadoPagoClient().createPreference({
        items: [{ id: 'verificacao-configuracao', title: 'TESTE de configuração — Diária Certa', quantity: 1, currency_id: 'BRL', unit_price: 1 }],
        external_reference: `diaria-certa-config-check-${randomUUID()}`,
        expires: true,
        expiration_date_from: new Date().toISOString(),
        expiration_date_to: new Date(Date.now() + 15 * 60000).toISOString(),
        ...(config.returnUrl ? { back_urls: { success: config.returnUrl, pending: config.returnUrl, failure: config.returnUrl }, auto_return: 'approved' } : {}),
        ...(config.notificationUrl ? { notification_url: config.notificationUrl } : {}),
      });
      const checkout = new URL(preference.init_point || preference.sandbox_init_point);
      const hosts = ['www.mercadopago.com.br', 'www.mercadopago.com', 'sandbox.mercadopago.com.br', 'sandbox.mercadopago.com'];
      if (String(preference.collector_id) !== config.collectorId || checkout.protocol !== 'https:' || !hosts.includes(checkout.hostname)) {
        throw new Error('Checkout incompatível com a conta de teste configurada.');
      }
      console.log(JSON.stringify({ checkout_teste_criado: true, checkout_host: checkout.hostname, webhook_configurado: Boolean(config.notificationUrl), retorno_automatico: Boolean(config.returnUrl), pagamento_realizado: false }));
    }
  }
} catch {
  console.error('Não foi possível consultar a conta do Mercado Pago. Confira a configuração e a conexão.');
  process.exitCode = 1;
}

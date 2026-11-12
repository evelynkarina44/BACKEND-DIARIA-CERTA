import 'dotenv/config';
import app from './app.js';
import prisma from './lib/prisma.js';
import { AgendamentoWorkflowService } from './services/agendamento/AgendamentoWorkflowService.js';
import { PaymentService } from './services/pagamento/PaymentService.js';
import { CheckinExpirationService } from './services/agendamento/CheckinExpirationService.js';

const port = Number(process.env.PORT) || 3000;
const server = app.listen(port, () => {
  console.log(`Servidor rodando na porta ${port}`);
});

const expirationService = new AgendamentoWorkflowService();
const expirationTimer = setInterval(() => {
  expirationService.expirePending().catch((error) => console.error('Falha ao expirar agendamentos', error));
}, 15 * 60 * 1000);
expirationTimer.unref();

const paymentService = new PaymentService();
let refundsRunning = false;
const refundTimer = setInterval(async () => {
  if (refundsRunning) return;
  refundsRunning = true;
  try { await paymentService.processRefunds(); }
  catch { console.error('Falha temporária ao processar a fila de estornos.'); }
  finally { refundsRunning = false; }
}, 60000);
refundTimer.unref();

const checkinExpirationService = new CheckinExpirationService();
let checkinExpirationRunning = false;
const checkinExpirationTimer = setInterval(async () => {
  if (checkinExpirationRunning) return;
  checkinExpirationRunning = true;
  try { await checkinExpirationService.run(); }
  catch { console.error('Falha temporária ao expirar check-ins.'); }
  finally { checkinExpirationRunning = false; }
}, 15000);
checkinExpirationTimer.unref();

async function shutdown(signal) {
  console.log(`${signal} recebido; encerrando servidor`);
  clearInterval(expirationTimer);
  clearInterval(refundTimer);
  clearInterval(checkinExpirationTimer);
  server.close(async () => {
    await prisma.$disconnect();
    process.exit(0);
  });
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

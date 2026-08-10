import 'dotenv/config';
import app from './app.js';
import prisma from './lib/prisma.js';
import { AgendamentoWorkflowService } from './services/agendamento/AgendamentoWorkflowService.js';

const port = Number(process.env.PORT) || 3000;
const server = app.listen(port, () => {
  console.log(`Servidor rodando na porta ${port}`);
});

const expirationService = new AgendamentoWorkflowService();
const expirationTimer = setInterval(() => {
  expirationService.expirePending().catch((error) => console.error('Falha ao expirar agendamentos', error));
}, 15 * 60 * 1000);
expirationTimer.unref();

async function shutdown(signal) {
  console.log(`${signal} recebido; encerrando servidor`);
  clearInterval(expirationTimer);
  server.close(async () => {
    await prisma.$disconnect();
    process.exit(0);
  });
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

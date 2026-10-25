import 'dotenv/config';
import prisma from '../src/lib/prisma.js';

try {
  const tables = await prisma.$queryRaw`SELECT TABLE_NAME FROM information_schema.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME IN ('chatbot_conversa', 'chatbot_mensagem', 'chatbot_proposta')`;
  const counts = await Promise.all([prisma.chatbot_conversa.count(), prisma.chatbot_mensagem.count(), prisma.chatbot_proposta.count()]);
  console.log(JSON.stringify({ tabelas: tables.map((item) => item.TABLE_NAME), contagens: counts, gemini_configurado: Boolean(process.env.GEMINI_API_KEY), modelo: process.env.GEMINI_MODEL || 'gemini-3.5-flash-lite' }, null, 2));
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
} finally {
  await prisma.$disconnect();
}

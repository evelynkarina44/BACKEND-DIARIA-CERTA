// Instala somente o controle de leitura. Não altera diárias ou pagamentos.
import 'dotenv/config';
import { readFile } from 'node:fs/promises';
import prisma from '../src/lib/prisma.js';
try {
  const tables = await prisma.$queryRaw`SELECT TABLE_NAME FROM information_schema.TABLES WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='notificacao_leitura'`;
  if (tables.length) {
    const columns = await prisma.$queryRaw`SELECT COLUMN_NAME FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='notificacao_leitura'`;
    if (!['id_usuario','perfil','chave_evento','lida_em'].every(name => columns.some(column => column.COLUMN_NAME === name))) throw new Error('Tabela existente incompatível. Nenhuma alteração foi feita.');
    console.log('Controle de leitura já instalado. Nenhum dado alterado.');
  } else {
    const sql = await readFile(new URL('../prisma/migrations/20261102000000_notification_reads/migration.sql', import.meta.url), 'utf8');
    await prisma.$executeRawUnsafe(sql);
    console.log('Criada somente notificacao_leitura. Nenhum agendamento ou pagamento foi alterado.');
  }
} catch (error) { console.error(error.message); process.exitCode = 1; }
finally { await prisma.$disconnect(); }

// Instala somente as tabelas novas. Não executa reset nem modifica dados ou migrações antigas.
import 'dotenv/config';
import { readFile } from 'node:fs/promises';
import prisma from '../src/lib/prisma.js';

try {
  const tables = await prisma.$queryRaw`
    SELECT TABLE_NAME FROM information_schema.TABLES
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME IN ('pagamento_parcela', 'pagamento_transacao')
  `;
  if (tables.length) {
    throw new Error('Já existem tabelas de pagamento. Nenhuma alteração foi feita; confira o schema antes de reinstalar.');
  }
  const sql = await readFile(new URL('../prisma/migrations/20261025000000_mercado_pago_parcelas/migration.sql', import.meta.url), 'utf8');
  // MySQL efetua commit implícito em DDL. Não simular uma transação reversível aqui.
  for (const statement of sql.split(';').map((part) => part.trim()).filter(Boolean)) {
    await prisma.$executeRawUnsafe(statement);
  }
  console.log('Criadas apenas pagamento_parcela e pagamento_transacao. Nenhum dado existente foi apagado.');
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
} finally {
  await prisma.$disconnect();
}

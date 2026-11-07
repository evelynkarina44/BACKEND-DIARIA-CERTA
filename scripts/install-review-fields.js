// Repara somente campos de avaliação ausentes em bancos legados.
// Não executa migrações antigas em lote, reset, exclusão de registros ou alteração financeira.
import 'dotenv/config';
import prisma from '../src/lib/prisma.js';

try {
  const columns = await prisma.$queryRaw`
    SELECT COLUMN_NAME FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='avaliacao'
  `;
  if (!columns.length) throw new Error('Tabela avaliacao ausente. Nenhuma alteração foi feita.');
  const names = new Set(columns.map(item => item.COLUMN_NAME));
  const indexes = await prisma.$queryRaw`
    SELECT INDEX_NAME FROM information_schema.STATISTICS
    WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='avaliacao'
  `;
  const statements = [];
  if (!names.has('autor_tipo')) statements.push("ADD COLUMN `autor_tipo` ENUM('Cliente','Diarista') NOT NULL DEFAULT 'Cliente'");
  if (!names.has('anonima')) statements.push('ADD COLUMN `anonima` BOOLEAN NOT NULL DEFAULT false');
  if (!indexes.some(item => item.INDEX_NAME === 'uq_avaliacao_agendamento_autor')) {
    // Impede falha por duplicidade antes de executar qualquer DDL (commit implícito no MySQL).
    const duplicates = names.has('autor_tipo')
      ? await prisma.$queryRaw`SELECT id_agendamento FROM avaliacao GROUP BY id_agendamento, autor_tipo HAVING COUNT(*) > 1 LIMIT 1`
      : await prisma.$queryRaw`SELECT id_agendamento FROM avaliacao GROUP BY id_agendamento HAVING COUNT(*) > 1 LIMIT 1`;
    if (duplicates.length) throw new Error('Existem avaliações duplicadas. Nenhum registro foi modificado; revise-as manualmente.');
    statements.push('ADD CONSTRAINT `uq_avaliacao_agendamento_autor` UNIQUE (`id_agendamento`,`autor_tipo`)');
  }
  if (!statements.length) console.log('Estrutura de avaliação já compatível. Nenhuma alteração.');
  else if (!process.argv.includes('--apply')) console.log('Faltam campos/índice de avaliação. Use --apply para adicionar; nenhum dado será apagado.');
  else {
    // Somente identificadores e definições constantes acima entram na instrução.
    await prisma.$executeRawUnsafe('ALTER TABLE `avaliacao` ' + statements.join(', '));
    console.log('Campos/índice de avaliação adicionados. Nenhuma avaliação ou pagamento foi alterado.');
  }
} catch (error) {
  console.error(error.message); process.exitCode = 1;
} finally { await prisma.$disconnect(); }

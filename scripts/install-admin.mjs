// Focused, additive installer for legacy databases with migration-history drift.
import 'dotenv/config';
import { readFile } from 'node:fs/promises';
import prisma from '../src/lib/prisma.js';
try {
  const columns = await prisma.$queryRaw`SELECT TABLE_NAME, COLUMN_NAME FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME IN ('usuario','denuncia','denuncia_analise')`;
  const has = (table, column) => columns.some(c => c.TABLE_NAME === table && c.COLUMN_NAME === column);
  if (!has('usuario', 'id_usuario') || !has('denuncia', 'id_denuncia')) throw new Error('Banco incompatível; nenhuma alteração executada.');
  const sql = await readFile(new URL('../prisma/migrations/20261117000000_admin_denuncias/migration.sql', import.meta.url), 'utf8');
  const steps = [];
  if (!has('usuario', 'administrador')) steps.push('ALTER TABLE usuario ADD COLUMN administrador BOOLEAN NOT NULL DEFAULT false');
  if (!has('denuncia', 'status')) steps.push("ALTER TABLE denuncia ADD COLUMN status ENUM('Pendente','EmAnalise','Resolvida','Arquivada') NOT NULL DEFAULT 'Pendente'");
  if (!has('denuncia', 'versao')) steps.push('ALTER TABLE denuncia ADD COLUMN versao INTEGER NOT NULL DEFAULT 0');
  if (!has('denuncia_analise', 'id_analise')) steps.push(sql.slice(sql.indexOf('CREATE TABLE')).trim().replace(/;$/, ''));
  if (!process.argv.includes('--apply')) console.log(`${steps.length} alterações aditivas pendentes. Use --apply; nenhum registro será apagado.`);
  else { for (const step of steps) await prisma.$executeRawUnsafe(step); console.log('Estrutura administrativa instalada; nenhum usuário recebeu permissão automaticamente.'); }
} finally { await prisma.$disconnect(); }

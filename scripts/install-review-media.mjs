import 'dotenv/config';
import { readFile } from 'node:fs/promises';
import prisma from '../src/lib/prisma.js';
try {
 const columns = await prisma.$queryRaw`SELECT TABLE_NAME,COLUMN_NAME FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME IN ('denuncia_anexo','avaliacao_anexo')`;
 const has = (t, c) => columns.some(x => x.TABLE_NAME === t && x.COLUMN_NAME === c);
 if (!has('denuncia_anexo', 'id_anexo')) throw new Error('Instale os anexos administrativos primeiro.');
 const steps = [];
 for (const [column, type] of [['tipo', "VARCHAR(10) NOT NULL DEFAULT 'image'"], ['mime', "VARCHAR(40) NOT NULL DEFAULT 'image/jpeg'"], ['chave_cliente', 'VARCHAR(80) NULL']]) {
  if (!has('denuncia_anexo', column)) steps.push('ALTER TABLE denuncia_anexo ADD COLUMN ' + column + ' ' + type);
 }
 const indexes = await prisma.$queryRaw`SELECT INDEX_NAME FROM information_schema.STATISTICS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='denuncia_anexo' AND INDEX_NAME='denuncia_anexo_id_denuncia_chave_cliente_key'`;
 if (!indexes.length) steps.push('CREATE UNIQUE INDEX denuncia_anexo_id_denuncia_chave_cliente_key ON denuncia_anexo (id_denuncia,chave_cliente)');
 if (!has('avaliacao_anexo', 'id_anexo')) {
  const sql = await readFile(new URL('../prisma/migrations/20261117020000_avaliacao_denuncia_midias/migration.sql', import.meta.url), 'utf8');
  steps.push(sql.slice(sql.indexOf('CREATE TABLE')).trim().replace(/;$/, ''));
 }
 if (!process.argv.includes('--apply')) console.log(steps.length + ' alterações aditivas pendentes.');
 else { for (const sql of steps) await prisma.$executeRawUnsafe(sql); console.log('Anexos instalados. Nenhuma avaliação, denúncia ou conta alterada.'); }
} finally { await prisma.$disconnect(); }

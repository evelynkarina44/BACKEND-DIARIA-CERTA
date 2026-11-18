import 'dotenv/config';
import { readFile } from 'node:fs/promises';
import prisma from '../src/lib/prisma.js';
try {
 const tables = await prisma.$queryRaw`SELECT TABLE_NAME FROM information_schema.TABLES WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='favorito_cliente'`;
 if (tables.length) console.log('Clientes favoritos já instalados.');
 else if (!process.argv.includes('--apply')) console.log('Uma tabela aditiva pendente. Favoritos existentes não serão alterados.');
 else {
  const sql = await readFile(new URL('../prisma/migrations/20261117040000_clientes_favoritos/migration.sql',import.meta.url),'utf8');
  await prisma.$executeRawUnsafe(sql.trim().replace(/;$/,''));
  console.log('Clientes favoritos instalados. Nenhum favorito real criado ou removido.');
 }
} finally { await prisma.$disconnect(); }

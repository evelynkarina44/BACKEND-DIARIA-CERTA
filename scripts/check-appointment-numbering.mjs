import 'dotenv/config';
import prisma from '../src/lib/prisma.js';

try {
  const version = await prisma.$queryRaw`SELECT VERSION() AS version`;
  const migrations = await prisma.$queryRaw`SELECT migration_name FROM _prisma_migrations WHERE finished_at IS NOT NULL AND rolled_back_at IS NULL ORDER BY migration_name`;
  console.log(JSON.stringify({ version: version[0].version, migrations: migrations.map(item => item.migration_name) }));
} finally { await prisma.$disconnect(); }

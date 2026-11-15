import 'dotenv/config';
import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import prisma from '../src/lib/prisma.js';

// Instala somente esta migração em bancos cujo baseline antigo foi aplicado manualmente.
// Não inicia servidor, jobs de expiração, cobranças ou estornos.
function canonical(value) {
  if (value instanceof Date) return value.toISOString();
  if (typeof value === 'bigint') return value.toString();
  if (Array.isArray(value)) return value.map(canonical);
  if (value && typeof value === 'object') return Object.fromEntries(Object.keys(value).sort().map(key => [key, canonical(value[key])]));
  return value;
}
const fingerprint = rows => createHash('sha256').update(JSON.stringify(canonical(rows))).digest('hex');
async function snapshot() {
  const appointments = await prisma.$queryRaw`SELECT * FROM agendamento ORDER BY id_agendamento`;
  const payments = await prisma.$queryRaw`SELECT id_parcela, id_agendamento, fase, valor_centavos, status FROM pagamento_parcela ORDER BY id_parcela`;
  return { count: appointments.length, bookings: fingerprint(appointments.map(({ numero_diarista, ...row }) => row)), payments: fingerprint(payments) };
}
try {
  const columns = await prisma.$queryRaw`SELECT COLUMN_NAME FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'agendamento' AND COLUMN_NAME = 'numero_diarista'`;
  if (columns.length) throw new Error('Coluna já existe; não reaplicar a migração.');
  const before = await snapshot();
  if (!process.argv.includes('--apply')) {
    console.log(JSON.stringify({ ready: true, appointments: before.count, note: 'Use --apply para aplicar somente a migração de numeração.' }));
  } else {
    const sql = await readFile(new URL('../prisma/migrations/20261115000000_numero_diaria_diarista/migration.sql', import.meta.url), 'utf8');
    for (const statement of sql.replace(/^--.*$/gm, '').split(';').map(item => item.trim()).filter(Boolean)) await prisma.$executeRawUnsafe(statement);
    const after = await snapshot();
    if (before.bookings !== after.bookings || before.payments !== after.payments) throw new Error('A verificação dos dados anteriores falhou; interrompa a implantação e investigue.');
    const invalid = await prisma.$queryRaw`SELECT COUNT(*) AS total FROM agendamento a JOIN diarista d ON d.id_diarista = a.id_diarista WHERE a.numero_diarista <= 0 OR a.numero_diarista > d.ultimo_numero_diaria`;
    if (Number(invalid[0].total)) throw new Error('Numeração inconsistente.');
    console.log(JSON.stringify({ applied: true, appointments: after.count, existingBookingsUnchanged: true, paymentsUnchanged: true }));
  }
} finally { await prisma.$disconnect(); }

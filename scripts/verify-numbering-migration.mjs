import 'dotenv/config';
import { createHash } from 'node:crypto';
import prisma from '../src/lib/prisma.js';
function canonical(value) {
  if (value instanceof Date) return value.toISOString();
  if (typeof value === 'bigint') return value.toString();
  if (Array.isArray(value)) return value.map(canonical);
  if (value && typeof value === 'object') return Object.fromEntries(Object.keys(value).sort().map(key => [key, canonical(value[key])]));
  return value;
}
const hash = value => createHash('sha256').update(JSON.stringify(value)).digest('hex');
try {
  const read = async () => (await prisma.$queryRaw`SELECT * FROM agendamento ORDER BY id_agendamento`).map(({numero_diarista,...row}) => row);
  const first = await read(), second = await read();
  const extras = await prisma.$queryRaw`SELECT COLUMN_NAME, EXTRA FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME IN ('agendamento','pagamento_parcela') AND EXTRA LIKE '%on update%'`;
  console.log(JSON.stringify({ automaticUpdates: extras }));
  const invalid = await prisma.$queryRaw`SELECT COUNT(*) AS total FROM agendamento a JOIN (SELECT id_agendamento, ROW_NUMBER() OVER (PARTITION BY id_diarista ORDER BY id_agendamento) AS numero FROM agendamento) numbered ON numbered.id_agendamento=a.id_agendamento WHERE a.numero_diarista <> numbered.numero`;
  const counters = await prisma.$queryRaw`SELECT COUNT(*) AS total FROM diarista d WHERE d.ultimo_numero_diaria <> COALESCE((SELECT MAX(a.numero_diarista) FROM agendamento a WHERE a.id_diarista=d.id_diarista),0)`;
  console.log(JSON.stringify({ appointments:first.length, rawObjectOrderingStable:hash(first)===hash(second), canonicalValuesStable:hash(canonical(first))===hash(canonical(second)), invalidNumbers:Number(invalid[0].total), invalidCounters:Number(counters[0].total) }));
} finally { await prisma.$disconnect(); }

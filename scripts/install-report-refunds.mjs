import 'dotenv/config';
import prisma from '../src/lib/prisma.js';
try {
 const columns = await prisma.$queryRaw`SELECT TABLE_NAME,COLUMN_NAME FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME IN ('denuncia','denuncia_analise')`;
 const has = (t,c) => columns.some(x => x.TABLE_NAME === t && x.COLUMN_NAME === c), steps = [];
 for (const [table,column,type] of [
  ['denuncia','id_agendamento','INTEGER NULL'], ['denuncia','solicita_reembolso','BOOLEAN NOT NULL DEFAULT false'],
  ['denuncia','reembolso_status',"VARCHAR(20) NOT NULL DEFAULT 'NaoSolicitado'"], ['denuncia','reembolso_valor_pago_centavos','INTEGER NULL'],
  ['denuncia_analise','decisao_reembolso','VARCHAR(20) NULL'],
 ]) if (!has(table,column)) steps.push('ALTER TABLE ' + table + ' ADD COLUMN ' + column + ' ' + type);
 const indexes = await prisma.$queryRaw`SELECT INDEX_NAME FROM information_schema.STATISTICS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='denuncia' AND INDEX_NAME='denuncia_id_agendamento_solicita_reembolso_idx'`;
 if (!indexes.length) steps.push('CREATE INDEX denuncia_id_agendamento_solicita_reembolso_idx ON denuncia (id_agendamento,solicita_reembolso)');
 const constraints = await prisma.$queryRaw`SELECT CONSTRAINT_NAME FROM information_schema.REFERENTIAL_CONSTRAINTS WHERE CONSTRAINT_SCHEMA=DATABASE() AND CONSTRAINT_NAME='denuncia_id_agendamento_fkey'`;
 if (!constraints.length) steps.push('ALTER TABLE denuncia ADD CONSTRAINT denuncia_id_agendamento_fkey FOREIGN KEY (id_agendamento) REFERENCES agendamento(id_agendamento) ON DELETE RESTRICT ON UPDATE CASCADE');
 if (!process.argv.includes('--apply')) console.log(steps.length + ' alterações aditivas pendentes.');
 else { for (const sql of steps) await prisma.$executeRawUnsafe(sql); console.log('Solicitações de reembolso habilitadas. Nenhum estorno solicitado ou pagamento alterado.'); }
} finally { await prisma.$disconnect(); }

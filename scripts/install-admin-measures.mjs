import 'dotenv/config';
import { readFile } from 'node:fs/promises';
import prisma from '../src/lib/prisma.js';
try {
 const columns = await prisma.$queryRaw`SELECT TABLE_NAME,COLUMN_NAME FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME IN ('usuario','denuncia_analise','denuncia_anexo')`;
 const has=(t,c)=>columns.some(x=>x.TABLE_NAME===t&&x.COLUMN_NAME===c);
 if(!has('usuario','administrador')||!has('denuncia_analise','id_analise')) throw new Error('Instale a estrutura administrativa primeiro.');
 const steps=[];
 for(const [table,column,type] of [
 ['usuario','suspenso_ate','TIMESTAMP(3) NULL'],['usuario','excluido_em','TIMESTAMP(3) NULL'],['usuario','versao_sessao','INTEGER NOT NULL DEFAULT 0'],
 ['denuncia_analise','acao',"VARCHAR(20) NOT NULL DEFAULT 'Nenhuma'"],['denuncia_analise','dias_suspensao','INTEGER NULL'],['denuncia_analise','suspenso_ate','TIMESTAMP(3) NULL']]){
 if(!has(table,column)) steps.push('ALTER TABLE '+table+' ADD COLUMN '+column+' '+type);
 }
 if(!has('denuncia_anexo','id_anexo')){
 const sql=await readFile(new URL('../prisma/migrations/20261117010000_admin_medidas_anexos/migration.sql',import.meta.url),'utf8');
 steps.push(sql.slice(sql.indexOf('CREATE TABLE')).trim().replace(/;$/,''));
 }
 if(!process.argv.includes('--apply')) console.log(steps.length+' alterações aditivas pendentes.');
 else {for(const sql of steps)await prisma.$executeRawUnsafe(sql);console.log('Estrutura instalada. Nenhuma conta suspensa ou excluída.');}
}finally{await prisma.$disconnect();}

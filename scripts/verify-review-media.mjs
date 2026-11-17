import 'dotenv/config';
import prisma from '../src/lib/prisma.js';
try {
 await prisma.denuncia_anexo.findFirst({ select: { id_anexo: true, tipo: true, mime: true } });
 await prisma.avaliacao.findFirst({ select: { id_avaliacao: true, anexos: { select: { id_anexo: true, tipo: true, mime: true } } } });
 const packet = await prisma.$queryRaw`SELECT @@max_allowed_packet AS maxPacket`;
 if (Number(packet[0].maxPacket) <= 10 * 1024 * 1024) throw new Error('Configure max_allowed_packet acima de 10 MB para os vídeos.');
 const results = {};
 for (const resource of ['avaliacao', 'denuncia']) {
  const response = await fetch('http://localhost:3000/api/' + resource + '/1/anexos', { method: 'POST', headers: { 'Content-Type': 'application/octet-stream' }, body: Buffer.from('não autenticado') });
  if (response.status !== 401) throw new Error('Upload sem sessão não foi rejeitado.');
  results[resource + 'WithoutToken'] = response.status;
 }
 const catalog = await fetch('http://localhost:3000/api/diarista?limit=1');
 if (catalog.status !== 200) throw new Error('Falha na consulta pública após habilitar metadados de mídia.');
 console.log(JSON.stringify({ mediaSchema: 'ok', maxPacket: Number(packet[0].maxPacket), publicCatalog: catalog.status, ...results, writes: 0 }));
} finally { await prisma.$disconnect(); }

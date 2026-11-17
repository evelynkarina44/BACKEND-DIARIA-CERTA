import 'dotenv/config';
import prisma from '../src/lib/prisma.js';
try {
  const user = await prisma.usuario.findUnique({ where: { email: 'admin@gmail.com' }, select: { id_usuario: true, nome: true, tipo: true, ativo: true, bloqueado: true } });
  console.log(JSON.stringify(user));
} finally { await prisma.$disconnect(); }

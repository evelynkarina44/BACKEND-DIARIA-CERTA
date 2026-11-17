import 'dotenv/config';
import prisma from '../src/lib/prisma.js';
import { createAuthSession } from '../src/services/auth/authSession.js';
import { usuarioPublicSelect } from '../src/services/usuario/usuarioSelect.js';
try {
  const user = await prisma.usuario.findUnique({ where: { email: 'admin@gmail.com' }, select: usuarioPublicSelect });
  if (!user?.administrador) throw new Error('Conta administrativa não provisionada.');
  const { token } = createAuthSession(user, 'ADMIN');
  const url = 'http://localhost:3000/api/admin/denuncias?limit=10&page=1';
  const unauthorized = await fetch(url);
  if (unauthorized.status !== 401) throw new Error('Consulta sem token não foi rejeitada.');
  const response = await fetch(url, { headers: { Authorization: 'Bearer ' + token } });
  const result = await response.json();
  if (response.status !== 200) throw new Error('Falha na consulta administrativa: HTTP ' + response.status);
  if (!Array.isArray(result.data)) throw new Error('Resposta administrativa inválida.');
  console.log(JSON.stringify({ health: 'ok', withoutToken: unauthorized.status, adminList: response.status, noStore: response.headers.get('cache-control') === 'no-store', count: result.pagination.total }));
  const users = await fetch('http://localhost:3000/api/admin/usuarios?limit=10&page=1', { headers: { Authorization: 'Bearer ' + token } });
  const table = await users.json();
  if(users.status!==200 || !Array.isArray(table.data)) throw new Error('Falha na consulta administrativa de usuários.');
  console.log(JSON.stringify({ usersTable:users.status,totalUsers:table.total_usuarios,noStore:users.headers.get('cache-control')==='no-store' }));
  // Read-only check of the real relationship query and audit projection.
  if (result.data[0]) {
    const detail = await fetch('http://localhost:3000/api/admin/denuncias/' + result.data[0].id_denuncia, { headers: { Authorization: 'Bearer ' + token } });
    if (detail.status !== 200) throw new Error('Falha ao abrir detalhes da denúncia.');
    console.log('Detalhamento administrativo: HTTP 200. Nenhuma denúncia foi modificada.');
  }
} finally { await prisma.$disconnect(); }

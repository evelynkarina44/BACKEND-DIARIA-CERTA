// Local-only provisioning: no HTTP route can grant administrator privileges.
import 'dotenv/config';
import { randomBytes } from 'node:crypto';
import bcrypt from 'bcryptjs';
import prisma from '../src/lib/prisma.js';
import { AuthService } from '../src/services/auth/AuthService.js';
const email = process.argv.find(arg => arg.startsWith('--email='))?.slice(8).trim().toLowerCase();
try {
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error('Informe --email=conta@exemplo.com');
  const existing = await prisma.usuario.findUnique({ where: { email }, select: { id_usuario: true, ativo: true, bloqueado: true, administrador: true } });
  if (existing) {
    if (!existing.ativo || existing.bloqueado) throw new Error('Conta inativa ou bloqueada. Nenhuma permissão alterada.');
    if (!process.argv.includes('--grant')) throw new Error('Conta existente. Use --grant para conceder acesso, sem alterar a senha.');
    await prisma.usuario.update({ where: { id_usuario: existing.id_usuario }, data: { administrador: true } });
    console.log('Acesso administrativo concedido. A senha existente foi preservada.');
  } else {
    if (!process.argv.includes('--create')) throw new Error('Conta inexistente. Use --create e ADMIN_INITIAL_PASSWORD, ou --generate-password.');
    const generated = process.argv.includes('--generate-password');
    const password = generated ? randomBytes(24).toString('base64url') : process.env.ADMIN_INITIAL_PASSWORD;
    if (!password || password.length < 16) throw new Error('Defina ADMIN_INITIAL_PASSWORD com pelo menos 16 caracteres.');
    await prisma.usuario.create({ data: { nome: 'Administração', email, senha: await bcrypt.hash(password, 12), telefone: '', administrador: true } });
    const session = await new AuthService().login({ email, senha: password });
    if (session.user.activeProfile !== 'ADMIN') throw new Error('Conta criada, mas a verificação de acesso falhou.');
    console.log('Conta administrativa criada: ' + email);
    if (generated) console.log('Senha gerada (guarde em local seguro): ' + password);
  }
} catch (error) { console.error(error.message); process.exitCode = 1; }
finally { await prisma.$disconnect(); }

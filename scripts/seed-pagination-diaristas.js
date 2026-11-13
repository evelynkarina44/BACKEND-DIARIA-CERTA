// Perfis fictícios para testar a paginação. Reexecutar não duplica os cadastros.
import 'dotenv/config';
import { randomBytes } from 'node:crypto';
import bcrypt from 'bcryptjs';
import prisma from '../src/lib/prisma.js';

const marker = 'PERFIL FICTÍCIO — teste de paginação; não contratar.';

try {
  const passwordHash = await bcrypt.hash(randomBytes(32).toString('hex'), 10);
  const created = await prisma.$transaction(async (tx) => {
    const service = await tx.servico.findFirst({ orderBy: { id_servico: 'asc' } });
    const profiles = [];
    for (let number = 1; number <= 4; number++) {
      const email = `teste.paginacao.diarista${number}@diaria-certa.invalid`;
      const existing = await tx.usuario.findUnique({ where: { email }, include: { diarista: true } });
      if (existing) {
        if (!existing.diarista.some(profile => profile.descricao === marker)) {
          throw new Error('Email reservado já utilizado por outro cadastro. Nenhum dado foi alterado.');
        }
        continue;
      }
      // Sem CPF real e sem senha conhecida: fixtures não representam pessoas reais.
      const user = await tx.usuario.create({ data: {
        nome: `Diarista Teste ${String(number).padStart(2, '0')}`,
        email, senha: passwordHash, telefone: '11900000000', cpf: null, tipo: 'DIARISTA',
      } });
      const profile = await tx.diarista.create({ data: {
        id_usuario: user.id_usuario, descricao: marker,
        data_nascimento: new Date('1990-01-01T00:00:00Z'), qtd_max_comodos: 8,
        endereco: { create: {
          cep: '06626-030', bairro: 'Teste de paginação', cidade: 'Jandira', estado: 'SP',
          logradouro: 'Rua de Teste (fictícia)', numero: number,
          complemento: 'Endereço fictício — não utilizar para visitas',
        } },
        ...(service ? { diarista_servico: { create: { id_servico: service.id_servico, preco: 100, ativo: true } } } : {}),
      } });
      profiles.push({ id_diarista: profile.id_diarista, nome: user.nome });
    }
    return profiles;
  });
  console.log(JSON.stringify({ criadas: created.length, perfis: created }, null, 2));
  console.log(`Total de diaristas ativas: ${await prisma.diarista.count({ where: { usuario: { ativo: true, bloqueado: false } } })}`);
} finally {
  await prisma.$disconnect();
}

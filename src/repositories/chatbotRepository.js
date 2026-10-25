import prisma from '../lib/prisma.js';

export class ChatbotRepository {
  constructor(database = prisma) { this.database = database; }

  find(id) {
    return this.database.chatbot_conversa.findUnique({
      where: { id_conversa: id },
      include: {
        mensagens: { orderBy: [{ criado_em: 'desc' }, { id_mensagem: 'desc' }], take: 401 },
        propostas: { orderBy: [{ criado_em: 'desc' }, { id_proposta: 'desc' }], take: 1 },
      },
    });
  }

  latest(id_cliente) {
    return this.database.chatbot_conversa.findFirst({ where: { id_cliente }, orderBy: { atualizado_em: 'desc' }, select: { id_conversa: true } });
  }

  async list(id_cliente, { page, limit }) {
    const where = { id_cliente };
    const [data, total] = await Promise.all([
      this.database.chatbot_conversa.findMany({
        where, orderBy: [{ atualizado_em: 'desc' }, { id_conversa: 'desc' }], skip: (page - 1) * limit, take: limit,
        select: {
          id_conversa: true, criado_em: true, atualizado_em: true,
          mensagens: { where: { papel: 'user' }, orderBy: [{ criado_em: 'asc' }, { id_mensagem: 'asc' }], take: 1, select: { conteudo: true } },
          _count: { select: { mensagens: true } },
        },
      }),
      this.database.chatbot_conversa.count({ where }),
    ]);
    return { data, pagination: { page, limit, total, pages: Math.ceil(total / limit) } };
  }

}

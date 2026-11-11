import { FavoritoRepository } from '../../repositories/favoritoRepository.js';
import { ForbiddenError } from '../../errors/index.js';
import { responseHistoryInclude, respondsQuickly } from '../diarista/responseSpeedPolicy.js';

export class ListFavoritoService {
  constructor(repository = new FavoritoRepository()) { this.repository = repository; }
  async execute({ page = 1, limit = 20 } = {}, auth) {
    if (!auth?.id_cliente) throw new ForbiddenError('É necessário um perfil de cliente');
    const where = { id_cliente: auth.id_cliente };
    const [data, total] = await Promise.all([
      this.repository.findAll({
        where,
        include: {
          diarista: {
            include: {
              usuario: { select: { nome: true, foto_perfil: true } },
              agendamento: responseHistoryInclude,
              endereco: { select: { bairro: true, cidade: true, estado: true } },
              diarista_servico: { include: { servico: true } },
              avaliacao: {
                where: { comentario_publico: true },
                select: { id_avaliacao: true, nota: true },
              },
            },
          },
        },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.repository.count(where),
    ]);
    const presented = data.map((favorite) => {
      if (!favorite.diarista) return favorite;
      const { agendamento, ...profile } = favorite.diarista;
      return { ...favorite, diarista: { ...profile, responde_rapido: respondsQuickly(agendamento) } };
    });
    return { data: presented, pagination: { page, limit, total, pages: Math.ceil(total / limit) } };
  }
}

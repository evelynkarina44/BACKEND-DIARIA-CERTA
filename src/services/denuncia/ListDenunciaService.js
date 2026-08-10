import { DenunciaRepository } from '../../repositories/denunciaRepository.js';

export class ListDenunciasService {
  constructor(repository = new DenunciaRepository()) { this.repository = repository; }
  async execute({ page = 1, limit = 20 } = {}, auth) {
    const where = { id_usuario_denunciante: auth.id_usuario };
    const [data, total] = await Promise.all([
      this.repository.findAll({ where, skip: (page - 1) * limit, take: limit, orderBy: { data_denuncia: 'desc' } }),
      this.repository.count(where),
    ]);
    return { data, pagination: { page, limit, total, pages: Math.ceil(total / limit) } };
  }
}

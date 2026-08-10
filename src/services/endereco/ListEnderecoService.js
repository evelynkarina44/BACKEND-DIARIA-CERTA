import { EnderecoRepository } from '../../repositories/enderecoRepository.js';

export class ListEnderecosService {
  constructor(repository = new EnderecoRepository()) { this.repository = repository; }
  async execute({ page = 1, limit = 20 } = {}, auth) {
    const where = { OR: [{ id_cliente: auth?.id_cliente ?? -1 }, { id_diarista: auth?.id_diarista ?? -1 }] };
    const [data, total] = await Promise.all([
      this.repository.findAll({ where, skip: (page - 1) * limit, take: limit }),
      this.repository.count(where),
    ]);
    return { data, pagination: { page, limit, total, pages: Math.ceil(total / limit) } };
  }
}

import { ClienteRepository } from '../../repositories/clienteRepository.js';

export class ListClientesService {
  constructor(repository = new ClienteRepository()) { this.repository = repository; }
  async execute(_query, auth) {
    const data = auth?.id_cliente ? await this.repository.findAll({ where: { id_cliente: auth.id_cliente } }) : [];
    return { data, pagination: { page: 1, limit: 1, total: data.length, pages: data.length ? 1 : 0 } };
  }
}

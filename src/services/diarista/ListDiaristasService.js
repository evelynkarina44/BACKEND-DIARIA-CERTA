import { DiaristaRepository } from "../../repositories/diaristaRepository.js";

const repository = new DiaristaRepository();

export class ListDiaristasService {
  async execute(filters) {
    const { data, total } = await repository.search(filters);
    return {
      data,
      pagination: {
        page: filters.page,
        limit: filters.limit,
        total,
        totalPages: Math.ceil(total / filters.limit),
      },
    };
  }
}

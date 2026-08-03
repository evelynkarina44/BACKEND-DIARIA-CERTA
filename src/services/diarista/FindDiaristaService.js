import { AppError } from "../../errors/AppError.js";
import { DiaristaRepository } from "../../repositories/diaristaRepository.js";

const repository = new DiaristaRepository();

export class FindDiaristaService {
  async execute(id) {
    const worker = await repository.findPublicById(id);
    if (!worker) throw new AppError("Diarista não encontrada.", 404, "WORKER_NOT_FOUND");
    return worker;
  }
}

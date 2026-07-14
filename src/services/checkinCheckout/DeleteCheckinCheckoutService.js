import { CheckinCheckoutRepository } from "../../repositories/checkinCheckoutRepository";

const checkinCheckoutRepository = new CheckinCheckoutRepository();

export class DeleteCheckinCheckoutService {
  async execute(id_check) {
    return checkinCheckoutRepository.delete(id_check);
  }
}
import { CheckinCheckoutRepository } from "../../repositories/checkinCheckoutRepository.js";

const checkinCheckoutRepository = new CheckinCheckoutRepository();

export class FindCheckinCheckoutService {
  async execute(id_check) {
    return checkinCheckoutRepository.findById(id_check);
  }
}
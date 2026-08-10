import { CheckinCheckoutRepository } from "../../repositories/checkinCheckoutRepository.js";

const checkinCheckoutRepository = new CheckinCheckoutRepository();

export class ListCheckinCheckoutService {
  async execute() {
    return checkinCheckoutRepository.findAll();
  }
}

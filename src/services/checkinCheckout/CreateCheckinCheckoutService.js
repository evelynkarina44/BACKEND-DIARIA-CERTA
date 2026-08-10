import { CheckinCheckoutRepository } from "../../repositories/checkinCheckoutRepository.js";

const checkinCheckoutRepository = new CheckinCheckoutRepository();

export class CreateCheckinCheckoutService {
  async execute(data) {
    return checkinCheckoutRepository.create(data);
  }
}
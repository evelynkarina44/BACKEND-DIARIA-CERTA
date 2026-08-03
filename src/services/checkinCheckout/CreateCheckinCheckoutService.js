import { CheckinCheckoutRepository } from "../../repositories/checkinCheckoutRepository";

const checkinCheckoutRepository = new CheckinCheckoutRepository();

export class CreateCheckinCheckoutService {
  async execute(data) {
    return checkinCheckoutRepository.create(data);
  }
}
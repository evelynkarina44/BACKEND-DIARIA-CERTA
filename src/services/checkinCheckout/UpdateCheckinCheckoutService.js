import { CheckinCheckoutRepository } from "../../repositories/checkinCheckoutRepository";

const checkinCheckoutRepository = new CheckinCheckoutRepository();

export class UpdateCheckinCheckoutService {
  async execute(id, data) {
    return checkinCheckoutRepository.update(id, data);
  }
}
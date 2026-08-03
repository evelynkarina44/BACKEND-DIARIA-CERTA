import { CheckinCheckoutRepository } from "../../repositories/checkinCheckoutRepository";

const checkinCheckoutRepository = new CheckinCheckoutRepository();

export class ListCheckinCheckoutService {
  async execute() {
    return checkinCheckoutRepository.list();
  }
}

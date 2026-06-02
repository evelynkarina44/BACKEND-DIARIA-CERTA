import { UserRepository } from "../../repositories/userRepository";

const userRepository = new UserRepository();

export class FindUserService {
  async execute(id) {
    return userRepository.findById(id);
  }
}
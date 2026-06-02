import { UserRepository } from "../../repositories/userRepository";

const userRepository = new UserRepository();

export class UpdateUserService {
  async execute(id, data) {
    return userRepository.update(id, data);
  }
}
import { UserRepository } from "../../repositories/userRepository";

const userRepository = new UserRepository();

export class CreateUserService {
  async execute(data) {
    return userRepository.create(data);
  }
}
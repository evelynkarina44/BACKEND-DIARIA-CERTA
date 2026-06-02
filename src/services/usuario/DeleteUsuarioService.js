import { UserRepository } from "../../repositories/userRepository";

const userRepository = new UserRepository();

export class DeleteUserService {
  async execute(id) {
    return userRepository.delete(id);
  }
}
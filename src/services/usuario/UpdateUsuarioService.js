import { UserRepository } from "../../repositories/userRepository";

const userRepository = new UserRepository();

export class UpdateUserService {
  async execute(id_usuario, data) {
    return userRepository.update(id_usuario, data);
  }
}
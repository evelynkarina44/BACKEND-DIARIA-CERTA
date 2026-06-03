import { UserRepository } from "../../repositories/userRepository";

const userRepository = new UserRepository();

export class DeleteUserService {
  async execute(id_usuario) {
    return userRepository.delete(id_usuario);
  }
}
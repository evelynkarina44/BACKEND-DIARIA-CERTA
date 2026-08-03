import { UserRepository } from "../../repositories/userRepository";

const userRepository = new UserRepository();

export class FindUserService {
  async execute(id_usuario) {
    return userRepository.findById(id_usuario);
  }
}
import { UserRepository } from "../../repositories/userRepository";

const userRepository = new UserRepository();

export class ListUsuariosService {
  async execute() {
    return userRepository.findAll();
  }
}
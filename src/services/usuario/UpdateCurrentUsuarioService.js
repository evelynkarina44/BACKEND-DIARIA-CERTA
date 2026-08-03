import { UserRepository } from "../../repositories/userRepository.js";

const userRepository = new UserRepository();

export class UpdateCurrentUsuarioService {
  execute(id, data) {
    return userRepository.updatePublicData(id, data);
  }
}

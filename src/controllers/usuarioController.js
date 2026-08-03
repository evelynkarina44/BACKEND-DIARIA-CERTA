import { UpdateCurrentUsuarioService } from "../services/usuario/UpdateCurrentUsuarioService.js";

const updateCurrentUsuarioService = new UpdateCurrentUsuarioService();

export class UsuarioController {
  async updateMe(req, res) {
    const user = await updateCurrentUsuarioService.execute(req.user.id, req.body);
    return res.status(200).json({ data: user });
  }
}

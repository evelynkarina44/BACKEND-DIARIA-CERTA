import { AuthService } from "../services/authService.js";

const authService = new AuthService();

export class AuthController {
  async register(req, res) {
    const result = await authService.register(req.body);
    return res.status(201).json({ data: result });
  }

  async login(req, res) {
    const result = await authService.login(req.body);
    return res.status(200).json({ data: result });
  }

  async me(req, res) {
    const user = await authService.getMe(req.user.id);
    return res.status(200).json({ data: user });
  }

  async changePassword(req, res) {
    await authService.changePassword(req.user.id, req.body);
    return res.status(204).send();
  }
}

import { AuthService } from '../services/auth/AuthService.js';

const authService = new AuthService();

export class AuthController {
  async login(req, res) {
    return res.status(200).json(await authService.login(req.body));
  }

  async me(req, res) {
    return res.status(200).json(await authService.me(req.auth.id_usuario, req.auth.activeProfile));
  }

  async selectProfile(req, res) {
    return res.status(200).json(await authService.selectProfile(req.auth.id_usuario, req.body.profile));
  }
}

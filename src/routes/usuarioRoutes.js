import express from "express";
import { UsuarioController } from "../controllers/usuarioController.js";
import { authenticate } from "../middlewares/auth.middleware.js";
import { validate } from "../middlewares/validate.js";
import { updateUsuarioSchema } from "../schemas/usuario/updateUsuarioSchema.js";

const router = express.Router();
const controller = new UsuarioController();

router.patch("/me", authenticate, validate(updateUsuarioSchema), controller.updateMe.bind(controller));

export default router;

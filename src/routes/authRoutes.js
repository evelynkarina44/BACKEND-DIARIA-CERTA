import express from "express";
import { AuthController } from "../controllers/authController.js";
import { authenticate } from "../middlewares/auth.middleware.js";
import { validate } from "../middlewares/validate.js";
import { changePasswordSchema, loginSchema, registerSchema } from "../schemas/authSchemas.js";

const router = express.Router();
const controller = new AuthController();

router.post("/register", validate(registerSchema), controller.register.bind(controller));
router.post("/login", validate(loginSchema), controller.login.bind(controller));
router.get("/me", authenticate, controller.me.bind(controller));
router.patch("/password", authenticate, validate(changePasswordSchema), controller.changePassword.bind(controller));

export default router;

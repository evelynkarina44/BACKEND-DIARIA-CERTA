import express from "express";
import { ServicoController } from "../controllers/servicoController.js";

const router = express.Router();
const controller = new ServicoController();

router.get("/", controller.list.bind(controller));

export default router;

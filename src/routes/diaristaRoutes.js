import express from "express";
import { DiaristaController } from "../controllers/diaristaController.js";
import { validate } from "../middlewares/validate.js";
import { diaristaParamsSchema, searchDiaristasSchema } from "../schemas/diarista/searchDiaristasSchema.js";

const router = express.Router();
const controller = new DiaristaController();

router.get("/", validate(searchDiaristasSchema), controller.list.bind(controller));
router.get("/:id_diarista", validate(diaristaParamsSchema), controller.find.bind(controller));

export default router;

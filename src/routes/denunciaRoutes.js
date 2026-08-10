import { Router } from 'express';
import { DenunciaController } from '../controllers/denunciaController.js';
import { authenticate } from '../middlewares/auth.js';
import { validate } from '../middlewares/validate.js';
import { createDenunciaSchema, idSchema, listQuerySchema, updateDenunciaSchema } from '../schemas/apiSchemas.js';

const router = Router();
const controller = new DenunciaController();

router.use(authenticate);
router.get('/', validate(listQuerySchema, 'query'), controller.listarDenuncias);
router.get('/:id', validate(idSchema, 'params'), controller.buscarDenunciaPorId);
router.post('/', validate(createDenunciaSchema), controller.criarDenuncia);
router.put('/:id', validate(idSchema, 'params'), validate(updateDenunciaSchema), controller.atualizarDenuncia);
router.delete('/:id', validate(idSchema, 'params'), controller.deletarDenuncia);

export default router;

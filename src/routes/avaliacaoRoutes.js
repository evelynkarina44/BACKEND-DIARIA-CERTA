import { Router } from 'express';
import { AvaliacaoController } from '../controllers/avaliacaoController.js';
import { authenticate } from '../middlewares/auth.js';
import { validate } from '../middlewares/validate.js';
import { createAvaliacaoSchema, idSchema, listQuerySchema, updateAvaliacaoSchema } from '../schemas/apiSchemas.js';

const router = Router();
const controller = new AvaliacaoController();

router.get('/', validate(listQuerySchema, 'query'), controller.listarAvaliacoes);
router.get('/:id', validate(idSchema, 'params'), controller.buscarAvaliacaoPorId);
router.post('/', authenticate, validate(createAvaliacaoSchema), controller.criarAvaliacao);
router.put('/:id', authenticate, validate(idSchema, 'params'), validate(updateAvaliacaoSchema), controller.atualizarAvaliacao);
router.delete('/:id', authenticate, validate(idSchema, 'params'), controller.deletarAvaliacao);

export default router;

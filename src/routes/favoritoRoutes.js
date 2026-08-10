import { Router } from 'express';
import { FavoritoController } from '../controllers/favoritoController.js';
import { authenticate, authorizeRoles } from '../middlewares/auth.js';
import { validate } from '../middlewares/validate.js';
import { createFavoritoSchema, idSchema, listQuerySchema } from '../schemas/apiSchemas.js';

const router = Router();
const controller = new FavoritoController();

router.use(authenticate, authorizeRoles('cliente'));
router.get('/', validate(listQuerySchema, 'query'), controller.listarFavoritos);
router.get('/:id', validate(idSchema, 'params'), controller.buscarFavoritoPorId);
router.post('/', validate(createFavoritoSchema), controller.criarFavorito);
router.delete('/:id', validate(idSchema, 'params'), controller.deletarFavorito);

export default router;

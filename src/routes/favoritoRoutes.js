import { Router } from 'express';
import { FavoritoController } from '../controllers/favoritoController.js';
import { authenticate, authorizeRoles } from '../middlewares/auth.js';
import { validate } from '../middlewares/validate.js';
import { createFavoritoSchema, idSchema, listQuerySchema } from '../schemas/apiSchemas.js';
import { createFavoritoClienteSchema } from '../schemas/apiSchemas.js';
import { WorkerFavoriteService } from '../services/favorito/WorkerFavoriteService.js';

const router = Router();
const controller = new FavoritoController();

router.use(authenticate);
router.use((_req,res,next) => { res.set('Cache-Control','no-store'); res.vary('Authorization'); next(); });
const workerFavorites = new WorkerFavoriteService();
router.get('/clientes', authorizeRoles('diarista'), validate(listQuerySchema, 'query'), async(req,res) => res.json(await workerFavorites.list(req.query,req.auth)));
router.get('/clientes/:id', authorizeRoles('diarista'), validate(idSchema,'params'), async(req,res) => res.json(await workerFavorites.find(req.params.id,req.auth)));
router.post('/clientes', authorizeRoles('diarista'), validate(createFavoritoClienteSchema), async(req,res) => res.status(201).json(await workerFavorites.create(req.body,req.auth)));
router.delete('/clientes/:id', authorizeRoles('diarista'), validate(idSchema,'params'), async(req,res) => { await workerFavorites.delete(req.params.id,req.auth); res.status(204).end(); });
router.use(authorizeRoles('cliente'));
router.get('/', validate(listQuerySchema, 'query'), controller.listarFavoritos);
router.get('/:id', validate(idSchema, 'params'), controller.buscarFavoritoPorId);
router.post('/', validate(createFavoritoSchema), controller.criarFavorito);
router.delete('/:id', validate(idSchema, 'params'), controller.deletarFavorito);

export default router;

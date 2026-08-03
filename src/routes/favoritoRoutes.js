import { express } from 'express';
import { FavoritoController } from '../controllers/favoritoController';

const router = express.Router();

const favoritoController = new FavoritoController();

router.get('/', favoritoController.listarFavoritos);

router.get('/:id', favoritoController.buscarFavoritoPorId);

router.post('/', favoritoController.criarFavorito);

router.put('/:id', favoritoController.atualizarFavorito);

router.delete('/:id', favoritoController.deletarFavorito);